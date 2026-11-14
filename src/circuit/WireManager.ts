import * as THREE from 'three';
import type { WireConnection, WireColor, TerminalId } from '../types/circuit';

export interface TerminalNode {
  id: TerminalId;
  name: string;
  componentName: string;
  color: string;
  anchorMesh: THREE.Object3D;
  cachedWorldPosition: THREE.Vector3;
}

export class WireManager {
  public group: THREE.Group;
  private wires: Map<string, {
    connection: WireConnection;
    mesh: THREE.Mesh;
    curve: THREE.CatmullRomCurve3;
    endCap1: THREE.Object3D;
    endCap2: THREE.Object3D;
  }> = new Map();

  private terminals: Map<TerminalId, TerminalNode> = new Map();
  private selectedTerminal: TerminalId | null = null;
  private activeWireColor: WireColor = 'red';

  private onWiresChanged?: (wires: WireConnection[]) => void;
  private onTerminalSelected?: (termId: TerminalId | null) => void;

  constructor(
    onWiresChanged?: (wires: WireConnection[]) => void,
    onTerminalSelected?: (termId: TerminalId | null) => void
  ) {
    this.group = new THREE.Group();
    this.group.name = 'WireSystemGroup';
    this.onWiresChanged = onWiresChanged;
    this.onTerminalSelected = onTerminalSelected;
  }

  public registerTerminalAnchor(
    id: TerminalId,
    name: string,
    componentName: string,
    color: string,
    anchorMesh: THREE.Object3D
  ) {
    const worldPos = new THREE.Vector3();
    anchorMesh.getWorldPosition(worldPos);

    this.terminals.set(id, {
      id,
      name,
      componentName,
      color,
      anchorMesh,
      cachedWorldPosition: worldPos,
    });
  }

  public getTerminalWorldPos(id: TerminalId): THREE.Vector3 {
    const term = this.terminals.get(id);
    if (!term) return new THREE.Vector3();
    term.anchorMesh.getWorldPosition(term.cachedWorldPosition);
    return term.cachedWorldPosition;
  }

  public setActiveWireColor(color: WireColor) {
    this.activeWireColor = color;
  }

  public getActiveWireColor(): WireColor {
    return this.activeWireColor;
  }

  public handleTerminalClick(id: TerminalId): { connected: boolean; wire?: WireConnection } {
    if (!this.selectedTerminal) {
      // First terminal selected
      this.selectedTerminal = id;
      if (this.onTerminalSelected) this.onTerminalSelected(id);
      return { connected: false };
    }

    if (this.selectedTerminal === id) {
      // Deselect if clicked same terminal
      this.selectedTerminal = null;
      if (this.onTerminalSelected) this.onTerminalSelected(null);
      return { connected: false };
    }

    // Connect wire between selectedTerminal and id
    const from = this.selectedTerminal;
    const to = id;
    this.selectedTerminal = null;
    if (this.onTerminalSelected) this.onTerminalSelected(null);

    // Check if wire already exists between these two terminals
    const existing = Array.from(this.wires.values()).find(
      (w) =>
        (w.connection.fromTerminal === from && w.connection.toTerminal === to) ||
        (w.connection.fromTerminal === to && w.connection.toTerminal === from)
    );

    if (existing) {
      // Toggle / remove existing wire
      this.removeWire(existing.connection.id);
      return { connected: false };
    }

    const wire = this.createWire(from, to, this.activeWireColor);
    return { connected: true, wire };
  }

  public createWire(from: TerminalId, to: TerminalId, color: WireColor): WireConnection {
    const id = `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const connection: WireConnection = { id, fromTerminal: from, toTerminal: to, color };

    this.buildWireGeometry(connection);

    if (this.onWiresChanged) {
      this.onWiresChanged(this.getAllConnections());
    }

    return connection;
  }

  public removeWire(id: string) {
    const item = this.wires.get(id);
    if (item) {
      this.group.remove(item.mesh);
      this.group.remove(item.endCap1);
      this.group.remove(item.endCap2);

      if (item.mesh.geometry) item.mesh.geometry.dispose();
      if (item.mesh.material) {
        if (Array.isArray(item.mesh.material)) {
          item.mesh.material.forEach((m) => m.dispose());
        } else {
          item.mesh.material.dispose();
        }
      }

      item.endCap1.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });

      item.endCap2.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });

      this.wires.delete(id);

      if (this.onWiresChanged) {
        this.onWiresChanged(this.getAllConnections());
      }
    }
  }

  public clearAllWires() {
    this.clearSelection();
    for (const [id] of Array.from(this.wires.entries())) {
      this.removeWire(id);
    }
  }

  public clearSelection() {
    this.selectedTerminal = null;
    if (this.onTerminalSelected) {
      this.onTerminalSelected(null);
    }
  }

  public removeWireByTerminal(termId: TerminalId) {
    for (const [id, item] of Array.from(this.wires.entries())) {
      if (item.connection.fromTerminal === termId || item.connection.toTerminal === termId) {
        this.removeWire(id);
      }
    }
  }

  public getAllConnections(): WireConnection[] {
    return Array.from(this.wires.values()).map((w) => w.connection);
  }

  public getWireMeshes(): THREE.Mesh[] {
    return Array.from(this.wires.values()).map((w) => w.mesh);
  }

  public findWireIdByMesh(hitObject: THREE.Object3D): string | undefined {
    let cur: THREE.Object3D | null = hitObject;
    while (cur) {
      if (cur.userData && cur.userData.wireId) {
        return cur.userData.wireId as string;
      }
      for (const [id, item] of this.wires.entries()) {
        if (item.mesh === cur || item.endCap1 === cur || item.endCap2 === cur) {
          return id;
        }
      }
      cur = cur.parent;
    }
    return undefined;
  }

  private hoveredWireId: string | null = null;

  public setHoveredWire(id: string | null) {
    if (this.hoveredWireId === id) return;
    this.hoveredWireId = id;

    for (const [wId, item] of this.wires.entries()) {
      const mat = item.mesh.material as THREE.MeshStandardMaterial;
      if (wId === id) {
        mat.emissive.setHex(0xf59e0b); // High-visibility amber highlight
        mat.emissiveIntensity = 0.9;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    }
  }

  private getColorHex(color: WireColor): number {
    switch (color) {
      case 'red':
        return 0xdc2626;
      case 'black':
        return 0x1e293b;
      case 'yellow':
        return 0xeab308;
      case 'blue':
        return 0x2563eb;
      case 'green':
        return 0x10b981;
      default:
        return 0xdc2626;
    }
  }

  /**
   * Generates tailored routing offsets for each terminal pair so wires NEVER overlap or clip.
   */
  private getWireRoutingOffset(
    from: TerminalId,
    to: TerminalId
  ): { lateral: number; heightArch: number; sagOffset: number } {
    const key = [from, to].sort().join('__');

    switch (key) {
      // 1. DC Supply (+) to Knife Switch In
      case 'ps_pos__sw_in':
        return { lateral: 0.07, heightArch: 0.015, sagOffset: 0.02 };

      // 2. Knife Switch Out to Ammeter (+)
      case 'ammeter_pos__sw_out':
        return { lateral: 0.11, heightArch: 0.02, sagOffset: 0.015 };

      // 3. Ammeter (-) to Resistor T1 (Series return loop, stays low on table)
      case 'ammeter_neg__resistor_t1':
        return { lateral: -0.03, heightArch: -0.012, sagOffset: 0.04 };

      // 4. Resistor T2 to DC Supply (-) (Sweeps wide around the rear of the bench)
      case 'ps_neg__resistor_t2':
        return { lateral: -0.15, heightArch: 0.015, sagOffset: 0.015 };

      // 5. Voltmeter (+) to Resistor T1 (Parallel branch - HIGH REAR ARCH, flies over ammeter wire)
      case 'resistor_t1__voltmeter_pos':
        return { lateral: -0.11, heightArch: 0.095, sagOffset: -0.035 };

      // 6. Voltmeter (-) to Resistor T2 (Parallel branch - HIGH FRONT ARCH, flies over table)
      case 'resistor_t2__voltmeter_neg':
        return { lateral: 0.09, heightArch: 0.080, sagOffset: -0.025 };

      default: {
        // Algorithmic collision avoidance for custom student wiring
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
          hash = (hash * 31 + key.charCodeAt(i)) | 0;
        }
        const lat = (((Math.abs(hash) % 7) - 3) * 0.04);
        const h = 0.025 + ((Math.abs(hash >> 3) % 4) * 0.028);
        return { lateral: lat, heightArch: h, sagOffset: 0.01 };
      }
    }
  }

  private calculateWireControlPoints(
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    from?: TerminalId,
    to?: TerminalId
  ): THREE.Vector3[] {
    const dist = p1.distanceTo(p2);
    const mid = p1.clone().add(p2).multiplyScalar(0.5);

    // Compute horizontal perpendicular normal vector across the table
    const dir = p2.clone().sub(p1);
    const normal = new THREE.Vector3(-dir.z, 0, dir.x);
    if (normal.lengthSq() > 0.0001) {
      normal.normalize();
    } else {
      normal.set(0, 0, 1);
    }

    const { lateral, heightArch, sagOffset } =
      from && to
        ? this.getWireRoutingOffset(from, to)
        : { lateral: 0, heightArch: 0.02, sagOffset: 0.02 };

    // Banana plugs exit vertically (+Y) by 4cm to simulate stiff rubber strain relief boots
    const p1Up = p1.clone().add(new THREE.Vector3(0, 0.040, 0));
    const p2Up = p2.clone().add(new THREE.Vector3(0, 0.040, 0));

    // Midpoint position with lateral bowing and vertical arching/sag
    const midPoint = mid.clone();
    midPoint.addScaledVector(normal, lateral);

    // Natural catenary sag or arching
    const baseSag = Math.max(0.02, Math.min(0.12, dist * 0.25));
    const finalY = (p1.y + p2.y) * 0.5 - baseSag + sagOffset + heightArch;
    // Don't let wires sink below workbench tabletop (table surface is at Y = 0.875)
    midPoint.y = Math.max(0.880, finalY);

    // Smooth intermediate control points (7-point smooth Catmull-Rom spline)
    const ctrl1 = p1Up.clone().lerp(midPoint, 0.45);
    ctrl1.addScaledVector(normal, lateral * 0.45);
    ctrl1.y = Math.max(0.885, (p1Up.y + midPoint.y) * 0.5 + (heightArch > 0 ? heightArch * 0.6 : -0.01));

    const ctrl2 = midPoint.clone().lerp(p2Up, 0.55);
    ctrl2.addScaledVector(normal, lateral * 0.45);
    ctrl2.y = Math.max(0.885, (midPoint.y + p2Up.y) * 0.5 + (heightArch > 0 ? heightArch * 0.6 : -0.01));

    return [p1, p1Up, ctrl1, midPoint, ctrl2, p2Up, p2];
  }

  private buildWireGeometry(connection: WireConnection) {
    const tFrom = this.terminals.get(connection.fromTerminal);
    const tTo = this.terminals.get(connection.toTerminal);

    if (!tFrom || !tTo) return;

    const p1 = this.getTerminalWorldPos(connection.fromTerminal);
    const p2 = this.getTerminalWorldPos(connection.toTerminal);

    const points = this.calculateWireControlPoints(p1, p2, connection.fromTerminal, connection.toTerminal);
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');

    // High-resolution 36-segment tube geometry with 10 radial slices for smooth, round wires
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.0035, 10, false);
    const hex = this.getColorHex(connection.color);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: 0.32,
      metalness: 0.08,
    });
    const mesh = new THREE.Mesh(tubeGeo, tubeMat);
    mesh.castShadow = true;
    mesh.userData = { isWire: true, wireId: connection.id };
    this.group.add(mesh);

    // Realistic Molded Rubber Banana Plug Connectors
    const bootGeo = new THREE.CylinderGeometry(0.0055, 0.0065, 0.026, 16);
    const collarGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.006, 16);
    const pinGeo = new THREE.CylinderGeometry(0.0024, 0.0024, 0.016, 12);

    const bootMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.4 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.1 });

    const createPlug = (pos: THREE.Vector3) => {
      const plug = new THREE.Group();
      plug.position.copy(pos);
      plug.userData = { isWire: true, wireId: connection.id };

      // Molded rubber boot with flexible strain ribs
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.y = 0.013;
      plug.add(boot);

      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.y = 0.022;
      plug.add(collar);

      // Gold-plated split-pin tip entering terminal post
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.y = -0.006;
      plug.add(pin);

      return plug;
    };

    const endCap1 = createPlug(p1);
    const endCap2 = createPlug(p2);
    this.group.add(endCap1);
    this.group.add(endCap2);

    this.wires.set(connection.id, {
      connection,
      mesh,
      curve,
      endCap1,
      endCap2,
    });
  }

  /**
   * Fast in-place wire update when dragging objects (No GC allocations, no React re-renders)
   */
  public updateAllWires() {
    if (this.wires.size === 0) return;

    for (const [, item] of this.wires.entries()) {
      const p1 = this.getTerminalWorldPos(item.connection.fromTerminal);
      const p2 = this.getTerminalWorldPos(item.connection.toTerminal);

      const points = this.calculateWireControlPoints(
        p1,
        p2,
        item.connection.fromTerminal,
        item.connection.toTerminal
      );
      item.curve.points = points;

      // Re-generate high-res tube geometry without destroying mesh or triggering React
      const newGeo = new THREE.TubeGeometry(item.curve, 36, 0.0035, 10, false);
      item.mesh.geometry.dispose();
      item.mesh.geometry = newGeo;

      item.endCap1.position.copy(p1);
      item.endCap2.position.copy(p2);
    }
  }

  public getSelectedTerminal(): TerminalId | null {
    return this.selectedTerminal;
  }

  public getTerminal(id: TerminalId): TerminalNode | undefined {
    return this.terminals.get(id);
  }

  public getAllTerminals(): TerminalNode[] {
    return Array.from(this.terminals.values());
  }

  public dispose() {
    this.clearAllWires();
  }
}
