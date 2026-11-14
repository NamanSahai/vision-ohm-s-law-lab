import * as THREE from 'three';

export class TransientPointerVisualizer {
  public group: THREE.Group;
  private rayLine: THREE.Line;
  private reticle: THREE.Mesh;
  private activeColor: number = 0x38bdf8;
  private pinchColor: number = 0xf59e0b;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'TransientPointerVisualizer';

    // 1-meter laser ray
    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1.5),
    ]);
    const rayMat = new THREE.LineBasicMaterial({
      color: this.activeColor,
      transparent: true,
      opacity: 0.5,
    });
    this.rayLine = new THREE.Line(rayGeo, rayMat);
    this.group.add(this.rayLine);

    // Reticle ring
    const ringGeo = new THREE.RingGeometry(0.012, 0.018, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.activeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.reticle = new THREE.Mesh(ringGeo, ringMat);
    this.reticle.position.set(0, 0, -1.5);
    this.group.add(this.reticle);

    this.group.visible = false;
  }

  public update(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    hitPoint: THREE.Vector3 | null,
    isPinching: boolean
  ) {
    this.group.visible = true;

    const endPoint = hitPoint ? hitPoint : origin.clone().add(direction.clone().multiplyScalar(2.0));
    const dist = origin.distanceTo(endPoint);

    // Update ray endpoints in local space
    this.group.position.copy(origin);
    this.group.lookAt(endPoint);

    const positions = (this.rayLine.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    positions[0] = 0;
    positions[1] = 0;
    positions[2] = 0;
    positions[3] = 0;
    positions[4] = 0;
    positions[5] = -dist;
    this.rayLine.geometry.attributes.position.needsUpdate = true;

    this.reticle.position.set(0, 0, -dist);

    const mat = this.reticle.material as THREE.MeshBasicMaterial;
    mat.color.setHex(isPinching ? this.pinchColor : this.activeColor);
  }

  public hide() {
    this.group.visible = false;
  }

  public dispose() {
    this.rayLine.geometry.dispose();
    (this.rayLine.material as THREE.Material).dispose();
    this.reticle.geometry.dispose();
    (this.reticle.material as THREE.Material).dispose();
  }
}
