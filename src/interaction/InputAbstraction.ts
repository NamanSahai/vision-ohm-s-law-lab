import * as THREE from 'three';
import type { InteractableObject3D } from '../types/interaction';

export interface DragState {
  object: InteractableObject3D;
  grabberId: string; // 'left-hand' | 'right-hand' | 'pointer-0' | 'mouse'
  offset: THREE.Vector3;
  grabPlane: THREE.Plane;
  initialObjectPos: THREE.Vector3;
}

export class InputAbstraction {
  private interactables: InteractableObject3D[] = [];
  private activeDrags: Map<string, DragState> = new Map();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private hoveredObjects: Map<string, InteractableObject3D> = new Map();

  public register(object: InteractableObject3D) {
    if (!this.interactables.includes(object)) {
      object.isInteractable = true;
      this.interactables.push(object);
    }
  }

  public unregister(object: InteractableObject3D) {
    const idx = this.interactables.indexOf(object);
    if (idx !== -1) {
      this.interactables.splice(idx, 1);
    }
    // Cancel any active drag on this object
    for (const [grabberId, drag] of this.activeDrags.entries()) {
      if (drag.object === object) {
        this.activeDrags.delete(grabberId);
      }
    }
  }

  public getInteractables(): InteractableObject3D[] {
    return this.interactables;
  }

  // --- WebXR Hand Pinch Processing ---
  public processHandPinch(
    grabberId: 'left-hand' | 'right-hand',
    pinchPos: THREE.Vector3 | null,
    isPinching: boolean
  ) {
    const existingDrag = this.activeDrags.get(grabberId);

    if (isPinching && pinchPos) {
      if (!existingDrag) {
        // Attempt to find closest interactable within grab radius (10cm)
        let closestObj: InteractableObject3D | null = null;
        let closestDist = 0.12; // 12cm reach

        for (const obj of this.interactables) {
          const worldPos = new THREE.Vector3();
          obj.getWorldPosition(worldPos);
          const dist = worldPos.distanceTo(pinchPos);
          if (dist < closestDist) {
            closestDist = dist;
            closestObj = obj;
          }
        }

        if (closestObj) {
          this.startDrag(grabberId, closestObj, pinchPos);
        }
      } else {
        // Continue dragging
        this.updateDrag(grabberId, pinchPos);
      }
    } else {
      if (existingDrag) {
        this.endDrag(grabberId);
      }
    }
  }

  // --- WebXR Ray / Transient Pointer Processing ---
  public raycastPointer(
    rayOrigin: THREE.Vector3,
    rayDirection: THREE.Vector3
  ): { hitObject: InteractableObject3D | null; hitPoint: THREE.Vector3 | null } {
    this.raycaster.set(rayOrigin, rayDirection);
    const intersects = this.raycaster.intersectObjects(this.interactables, true);

    if (intersects.length > 0) {
      // Find root interactable
      let cur: THREE.Object3D | null = intersects[0].object;
      while (cur && !this.interactables.includes(cur as InteractableObject3D)) {
        cur = cur.parent;
      }
      if (cur) {
        return {
          hitObject: cur as InteractableObject3D,
          hitPoint: intersects[0].point,
        };
      }
    }
    return { hitObject: null, hitPoint: null };
  }

  public processPointerSelect(
    grabberId: string,
    rayOrigin: THREE.Vector3,
    rayDirection: THREE.Vector3,
    isSelectStart: boolean
  ) {
    if (isSelectStart) {
      const { hitObject, hitPoint } = this.raycastPointer(rayOrigin, rayDirection);
      if (hitObject && hitPoint) {
        this.startDrag(grabberId, hitObject, hitPoint);
      }
    } else {
      if (this.activeDrags.has(grabberId)) {
        this.endDrag(grabberId);
      }
    }
  }

  public updatePointerDrag(
    grabberId: string,
    rayOrigin: THREE.Vector3,
    rayDirection: THREE.Vector3
  ) {
    const drag = this.activeDrags.get(grabberId);
    if (!drag) return;

    this.raycaster.set(rayOrigin, rayDirection);
    const intersectionPoint = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(drag.grabPlane, intersectionPoint);

    if (hit) {
      this.updateDrag(grabberId, intersectionPoint);
    }
  }

  // --- Desktop Mouse Processing ---
  public processDesktopMouseDown(
    mouseNormalized: THREE.Vector2,
    camera: THREE.Camera
  ): boolean {
    this.raycaster.setFromCamera(mouseNormalized, camera);
    const intersects = this.raycaster.intersectObjects(this.interactables, true);

    if (intersects.length > 0) {
      let cur: THREE.Object3D | null = intersects[0].object;
      while (cur && !this.interactables.includes(cur as InteractableObject3D)) {
        cur = cur.parent;
      }
      if (cur) {
        this.startDrag('desktop-mouse', cur as InteractableObject3D, intersects[0].point);
        return true;
      }
    }
    return false;
  }

  public processDesktopMouseMove(
    mouseNormalized: THREE.Vector2,
    camera: THREE.Camera
  ) {
    const drag = this.activeDrags.get('desktop-mouse');
    if (drag) {
      this.raycaster.setFromCamera(mouseNormalized, camera);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(drag.grabPlane, hitPoint)) {
        this.updateDrag('desktop-mouse', hitPoint);
      }
    } else {
      // Hover detection
      this.raycaster.setFromCamera(mouseNormalized, camera);
      const intersects = this.raycaster.intersectObjects(this.interactables, true);
      let hovered: InteractableObject3D | null = null;
      if (intersects.length > 0) {
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur && !this.interactables.includes(cur as InteractableObject3D)) {
          cur = cur.parent;
        }
        hovered = cur as InteractableObject3D;
      }

      const prev = this.hoveredObjects.get('desktop-mouse');
      if (prev !== hovered) {
        if (prev && prev.onHoverEnd) prev.onHoverEnd();
        if (hovered && hovered.onHoverStart) hovered.onHoverStart();
        if (hovered) {
          this.hoveredObjects.set('desktop-mouse', hovered);
        } else {
          this.hoveredObjects.delete('desktop-mouse');
        }
      }
    }
  }

  public processDesktopMouseUp() {
    if (this.activeDrags.has('desktop-mouse')) {
      this.endDrag('desktop-mouse');
    }
  }

  // --- Common Drag Operations ---
  private startDrag(grabberId: string, obj: InteractableObject3D, grabPoint: THREE.Vector3) {
    obj.isGrabbed = true;
    obj.grabberId = grabberId;

    const currentPos = obj.position.clone();
    const offset = currentPos.clone().sub(grabPoint);

    // Create a drag plane oriented parallel to workbench table (horizontal plane through grab point)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -grabPoint.y);

    this.activeDrags.set(grabberId, {
      object: obj,
      grabberId,
      offset,
      grabPlane: plane,
      initialObjectPos: currentPos,
    });

    if (obj.onGrabStart) {
      obj.onGrabStart(grabPoint);
    }
  }

  private updateDrag(grabberId: string, currentPoint: THREE.Vector3) {
    const drag = this.activeDrags.get(grabberId);
    if (!drag) return;

    const newPos = currentPoint.clone().add(drag.offset);

    // Mutual apparatus obstacle collision resolution (prevents apparatus from overlapping or clipping)
    for (const other of this.interactables) {
      if (other === drag.object) continue;
      const dx = newPos.x - other.position.x;
      const dz = newPos.z - other.position.z;
      const dist = Math.hypot(dx, dz);
      const minDistance = 0.165; // realistic physical clearance so apparatus cases never penetrate
      if (dist < minDistance && dist > 0.0001) {
        const overlap = minDistance - dist;
        newPos.x += (dx / dist) * overlap;
        newPos.z += (dz / dist) * overlap;
      }
    }

    // Workbench boundary clamp
    // Table is centered at [0, 0.85, -0.6], width 1.6m, depth 0.9m, surface at Y = 0.88
    newPos.x = THREE.MathUtils.clamp(newPos.x, -0.72, 0.72);
    newPos.z = THREE.MathUtils.clamp(newPos.z, -0.96, -0.24);
    newPos.y = 0.885; // Keep safely resting on teak table surface

    drag.object.position.copy(newPos);

    if (drag.object.onGrabMove) {
      drag.object.onGrabMove(currentPoint);
    }
  }

  private endDrag(grabberId: string) {
    const drag = this.activeDrags.get(grabberId);
    if (!drag) return;

    drag.object.isGrabbed = false;
    drag.object.grabberId = null;

    if (drag.object.onGrabEnd) {
      drag.object.onGrabEnd();
    }

    this.activeDrags.delete(grabberId);
  }

  public isDragging(grabberId?: string): boolean {
    if (grabberId) return this.activeDrags.has(grabberId);
    return this.activeDrags.size > 0;
  }
}
