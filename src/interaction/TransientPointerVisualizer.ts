import * as THREE from 'three';

export class TransientPointerVisualizer {
  public group: THREE.Group;
  private rayLine: THREE.Line;
  private reticleGroup: THREE.Group;
  private reticleRing: THREE.Mesh;
  private touchSphere: THREE.Mesh;
  private handProxyGroup: THREE.Group;
  private palmDisc: THREE.Mesh;
  private indexTip: THREE.Mesh;
  private thumbTip: THREE.Mesh;
  private knuckleGroup: THREE.Group;

  private activeColor: number = 0x38bdf8; // Bright cyan
  private pinchColor: number = 0xf59e0b;  // Glowing amber gold

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'TransientPointerVisualizer';

    // 1. Sleek laser ray line
    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1.5),
    ]);
    const rayMat = new THREE.LineBasicMaterial({
      color: this.activeColor,
      transparent: true,
      opacity: 0.65,
    });
    this.rayLine = new THREE.Line(rayGeo, rayMat);
    this.group.add(this.rayLine);

    // 2. Holographic Spatial Hand Proxy (at ray origin / hand position)
    this.handProxyGroup = new THREE.Group();
    this.handProxyGroup.name = 'HolographicHandProxy';

    // Palm floating disc
    const palmGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.005, 24);
    const palmMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.palmDisc = new THREE.Mesh(palmGeo, palmMat);
    this.palmDisc.rotation.x = Math.PI / 2;
    this.handProxyGroup.add(this.palmDisc);

    // Knuckles row
    this.knuckleGroup = new THREE.Group();
    for (let k = -1.5; k <= 1.5; k += 1) {
      const kGeo = new THREE.SphereGeometry(0.006, 12, 12);
      const kMat = new THREE.MeshStandardMaterial({
        color: this.activeColor,
        emissive: this.activeColor,
        emissiveIntensity: 0.5,
      });
      const kMesh = new THREE.Mesh(kGeo, kMat);
      kMesh.position.set(k * 0.012, 0.012, -0.015);
      this.knuckleGroup.add(kMesh);
    }
    this.handProxyGroup.add(this.knuckleGroup);

    // Index fingertip node
    const tipGeo = new THREE.SphereGeometry(0.008, 16, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x34d399, // Emerald tip
      emissive: 0x34d399,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.indexTip = new THREE.Mesh(tipGeo, tipMat);
    this.indexTip.position.set(-0.008, 0.015, -0.045);
    this.handProxyGroup.add(this.indexTip);

    // Thumb tip node
    const thumbMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.thumbTip = new THREE.Mesh(tipGeo, thumbMat);
    this.thumbTip.position.set(0.018, -0.005, -0.035);
    this.handProxyGroup.add(this.thumbTip);

    this.group.add(this.handProxyGroup);

    // 3. Reticle and Touch Sphere (at hit point)
    this.reticleGroup = new THREE.Group();
    this.reticleGroup.position.set(0, 0, -1.5);

    // Flat orientation ring
    const ringGeo = new THREE.RingGeometry(0.016, 0.024, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.activeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.reticleRing = new THREE.Mesh(ringGeo, ringMat);
    this.reticleGroup.add(this.reticleRing);

    // 3D Touch sphere
    const touchGeo = new THREE.SphereGeometry(0.012, 16, 16);
    const touchMat = new THREE.MeshStandardMaterial({
      color: this.activeColor,
      emissive: this.activeColor,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9,
    });
    this.touchSphere = new THREE.Mesh(touchGeo, touchMat);
    this.reticleGroup.add(this.touchSphere);

    this.group.add(this.reticleGroup);
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
    const dist = Math.max(0.05, origin.distanceTo(endPoint));

    // Position and orient laser beam at origin pointing toward target
    this.group.position.copy(origin);
    this.group.lookAt(endPoint);

    // Update ray endpoints in local space
    const positions = (this.rayLine.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    positions[0] = 0;
    positions[1] = 0;
    positions[2] = 0;
    positions[3] = 0;
    positions[4] = 0;
    positions[5] = -dist;
    this.rayLine.geometry.attributes.position.needsUpdate = true;

    // Reticle at target endpoint
    this.reticleGroup.position.set(0, 0, -dist);

    // Update Hand Proxy pinch animation:
    // When pinching, index tip and thumb tip animate together
    if (isPinching) {
      this.indexTip.position.set(0.002, 0.008, -0.040);
      this.thumbTip.position.set(-0.002, 0.008, -0.040);
      (this.indexTip.material as THREE.MeshStandardMaterial).color.setHex(this.pinchColor);
      (this.indexTip.material as THREE.MeshStandardMaterial).emissive.setHex(this.pinchColor);
      (this.thumbTip.material as THREE.MeshStandardMaterial).color.setHex(this.pinchColor);
      (this.thumbTip.material as THREE.MeshStandardMaterial).emissive.setHex(this.pinchColor);
      (this.palmDisc.material as THREE.MeshStandardMaterial).emissive.setHex(this.pinchColor);

      // Reticle active pinch state
      (this.reticleRing.material as THREE.MeshBasicMaterial).color.setHex(this.pinchColor);
      (this.touchSphere.material as THREE.MeshStandardMaterial).color.setHex(this.pinchColor);
      (this.touchSphere.material as THREE.MeshStandardMaterial).emissive.setHex(this.pinchColor);
      this.touchSphere.scale.set(1.4, 1.4, 1.4);
    } else {
      this.indexTip.position.set(-0.008, 0.015, -0.045);
      this.thumbTip.position.set(0.018, -0.005, -0.035);
      (this.indexTip.material as THREE.MeshStandardMaterial).color.setHex(0x34d399);
      (this.indexTip.material as THREE.MeshStandardMaterial).emissive.setHex(0x34d399);
      (this.thumbTip.material as THREE.MeshStandardMaterial).color.setHex(this.activeColor);
      (this.thumbTip.material as THREE.MeshStandardMaterial).emissive.setHex(this.activeColor);
      (this.palmDisc.material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);

      (this.reticleRing.material as THREE.MeshBasicMaterial).color.setHex(this.activeColor);
      (this.touchSphere.material as THREE.MeshStandardMaterial).color.setHex(this.activeColor);
      (this.touchSphere.material as THREE.MeshStandardMaterial).emissive.setHex(this.activeColor);
      this.touchSphere.scale.set(1.0, 1.0, 1.0);
    }
  }

  public hide() {
    this.group.visible = false;
  }

  public dispose() {
    this.rayLine.geometry.dispose();
    (this.rayLine.material as THREE.Material).dispose();
    this.reticleRing.geometry.dispose();
    (this.reticleRing.material as THREE.Material).dispose();
    this.touchSphere.geometry.dispose();
    (this.touchSphere.material as THREE.Material).dispose();
    this.palmDisc.geometry.dispose();
    (this.palmDisc.material as THREE.Material).dispose();
    this.indexTip.geometry.dispose();
    (this.indexTip.material as THREE.Material).dispose();
    this.thumbTip.geometry.dispose();
    (this.thumbTip.material as THREE.Material).dispose();
  }
}
