import * as THREE from 'three';

export class TransientPointerVisualizer {
  public group: THREE.Group;
  private reticleGroup: THREE.Group;
  private reticleRing: THREE.Mesh;
  private reticleCenterDot: THREE.Mesh;

  private activeColor: number = 0x38bdf8; // Elegant cyan
  private pinchColor: number = 0xf59e0b;  // Golden amber

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'TransientPointerVisualizer';

    // In visionOS, gaze ray beam should NOT shoot out of the user's eyes.
    // Instead, interaction is driven by a clean, subtle spatial reticle at the target surface.
    this.reticleGroup = new THREE.Group();
    this.reticleGroup.name = 'GazeSpatialReticle';

    // Sleek, minimal flat ring (subtle 10mm radius, doesn't obstruct vision)
    const ringGeo = new THREE.RingGeometry(0.008, 0.012, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.activeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      depthTest: true,
    });
    this.reticleRing = new THREE.Mesh(ringGeo, ringMat);
    this.reticleGroup.add(this.reticleRing);

    // Subtle center pinpoint dot (2mm)
    const dotGeo = new THREE.CircleGeometry(0.0025, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    this.reticleCenterDot = new THREE.Mesh(dotGeo, dotMat);
    this.reticleCenterDot.position.z = 0.001;
    this.reticleGroup.add(this.reticleCenterDot);

    this.group.add(this.reticleGroup);
    this.group.visible = false;
  }

  public update(
    origin: THREE.Vector3,
    _direction: THREE.Vector3,
    hitPoint: THREE.Vector3 | null,
    isPinching: boolean
  ) {
    if (!hitPoint) {
      // Don't clutter the user's view if they are gazing into empty space
      this.group.visible = false;
      return;
    }

    this.group.visible = true;

    // Position the subtle reticle at the exact surface hit point
    this.reticleGroup.position.copy(hitPoint);

    // Orient reticle to face the user's eye/head origin
    this.reticleGroup.lookAt(origin);

    if (isPinching) {
      (this.reticleRing.material as THREE.MeshBasicMaterial).color.setHex(this.pinchColor);
      (this.reticleRing.material as THREE.MeshBasicMaterial).opacity = 0.95;
      this.reticleGroup.scale.set(1.3, 1.3, 1.3);
    } else {
      (this.reticleRing.material as THREE.MeshBasicMaterial).color.setHex(this.activeColor);
      (this.reticleRing.material as THREE.MeshBasicMaterial).opacity = 0.75;
      this.reticleGroup.scale.set(1.0, 1.0, 1.0);
    }
  }

  public hide() {
    this.group.visible = false;
  }

  public dispose() {
    this.reticleRing.geometry.dispose();
    (this.reticleRing.material as THREE.Material).dispose();
    this.reticleCenterDot.geometry.dispose();
    (this.reticleCenterDot.material as THREE.Material).dispose();
  }
}
