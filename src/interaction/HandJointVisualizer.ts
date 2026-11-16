import * as THREE from 'three';

export const XR_HAND_JOINTS = [
  'wrist',
  'thumb-metacarpal',
  'thumb-phalanx-proximal',
  'thumb-phalanx-distal',
  'thumb-tip',
  'index-finger-metacarpal',
  'index-finger-phalanx-proximal',
  'index-finger-phalanx-intermediate',
  'index-finger-phalanx-distal',
  'index-finger-tip',
  'middle-finger-metacarpal',
  'middle-finger-phalanx-proximal',
  'middle-finger-phalanx-intermediate',
  'middle-finger-phalanx-distal',
  'middle-finger-tip',
  'ring-finger-metacarpal',
  'ring-finger-phalanx-proximal',
  'ring-finger-phalanx-intermediate',
  'ring-finger-phalanx-distal',
  'ring-finger-tip',
  'pinky-finger-metacarpal',
  'pinky-finger-phalanx-proximal',
  'pinky-finger-phalanx-intermediate',
  'pinky-finger-phalanx-distal',
  'pinky-finger-tip',
] as const;

export type XRHandJointName = (typeof XR_HAND_JOINTS)[number];

// 24 articulated finger segments
export const BONE_CONNECTIONS: [XRHandJointName, XRHandJointName][] = [
  // Thumb
  ['wrist', 'thumb-metacarpal'],
  ['thumb-metacarpal', 'thumb-phalanx-proximal'],
  ['thumb-phalanx-proximal', 'thumb-phalanx-distal'],
  ['thumb-phalanx-distal', 'thumb-tip'],
  // Index
  ['wrist', 'index-finger-metacarpal'],
  ['index-finger-metacarpal', 'index-finger-phalanx-proximal'],
  ['index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate'],
  ['index-finger-phalanx-intermediate', 'index-finger-phalanx-distal'],
  ['index-finger-phalanx-distal', 'index-finger-tip'],
  // Middle
  ['wrist', 'middle-finger-metacarpal'],
  ['middle-finger-metacarpal', 'middle-finger-phalanx-proximal'],
  ['middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate'],
  ['middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal'],
  ['middle-finger-phalanx-distal', 'middle-finger-tip'],
  // Ring
  ['wrist', 'ring-finger-metacarpal'],
  ['ring-finger-metacarpal', 'ring-finger-phalanx-proximal'],
  ['ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate'],
  ['ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal'],
  ['ring-finger-phalanx-distal', 'ring-finger-tip'],
  // Pinky
  ['wrist', 'pinky-finger-metacarpal'],
  ['pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal'],
  ['pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate'],
  ['pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal'],
  ['pinky-finger-phalanx-distal', 'pinky-finger-tip'],
];

// Palm cross connections forming solid connected palm structure
export const PALM_CONNECTIONS: [XRHandJointName, XRHandJointName][] = [
  ['thumb-metacarpal', 'index-finger-metacarpal'],
  ['index-finger-metacarpal', 'middle-finger-metacarpal'],
  ['middle-finger-metacarpal', 'ring-finger-metacarpal'],
  ['ring-finger-metacarpal', 'pinky-finger-metacarpal'],
];

const ALL_CONNECTIONS = [...BONE_CONNECTIONS, ...PALM_CONNECTIONS];

// Natural physiological joint radius (meters)
const JOINT_RADII: Record<XRHandJointName, number> = {
  'wrist': 0.0090,
  'thumb-metacarpal': 0.0075,
  'thumb-phalanx-proximal': 0.0068,
  'thumb-phalanx-distal': 0.0058,
  'thumb-tip': 0.0052,
  'index-finger-metacarpal': 0.0068,
  'index-finger-phalanx-proximal': 0.0058,
  'index-finger-phalanx-intermediate': 0.0050,
  'index-finger-phalanx-distal': 0.0044,
  'index-finger-tip': 0.0048,
  'middle-finger-metacarpal': 0.0070,
  'middle-finger-phalanx-proximal': 0.0060,
  'middle-finger-phalanx-intermediate': 0.0052,
  'middle-finger-phalanx-distal': 0.0045,
  'middle-finger-tip': 0.0048,
  'ring-finger-metacarpal': 0.0065,
  'ring-finger-phalanx-proximal': 0.0056,
  'ring-finger-phalanx-intermediate': 0.0048,
  'ring-finger-phalanx-distal': 0.0042,
  'ring-finger-tip': 0.0046,
  'pinky-finger-metacarpal': 0.0060,
  'pinky-finger-phalanx-proximal': 0.0052,
  'pinky-finger-phalanx-intermediate': 0.0044,
  'pinky-finger-phalanx-distal': 0.0038,
  'pinky-finger-tip': 0.0042,
};

// Reusable math scratch vectors (zero GC pressure per frame)
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _unitY = new THREE.Vector3(0, 1, 0);

export class HandJointVisualizer {
  public group: THREE.Group;
  public handedness: 'left' | 'right';
  private jointMeshes: Map<XRHandJointName, THREE.Mesh> = new Map();
  private boneMeshes: THREE.Mesh[] = [];
  public isPinching: boolean = false;
  private pinchIndicator: THREE.Mesh;

  private sharedSphereGeo: THREE.SphereGeometry;
  private sharedCylinderGeo: THREE.CylinderGeometry;

  private jointMaterial: THREE.MeshStandardMaterial;
  private boneMaterial: THREE.MeshStandardMaterial;
  private tipMaterial: THREE.MeshStandardMaterial;
  private pinchMaterial: THREE.MeshStandardMaterial;

  constructor(handedness: 'left' | 'right') {
    this.handedness = handedness;
    this.group = new THREE.Group();
    this.group.name = `HandVisualizer_${handedness}`;

    // Clean ergonomic spatial glove theme
    const baseColor = handedness === 'left' ? 0x38bdf8 : 0x818cf8; // cyan (left) / indigo-lavender (right)
    this.jointMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.25,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88,
      emissive: baseColor,
      emissiveIntensity: 0.20,
    });

    this.boneMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.30,
      metalness: 0.18,
      transparent: true,
      opacity: 0.84,
      emissive: baseColor,
      emissiveIntensity: 0.16,
    });

    this.tipMaterial = new THREE.MeshStandardMaterial({
      color: 0x34d399, // emerald tactile touch contact
      roughness: 0.2,
      metalness: 0.4,
      emissive: 0x34d399,
      emissiveIntensity: 0.55,
    });

    this.pinchMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // amber gold active pinch haptic energy
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.95,
    });

    // 1. Shared unit geometries
    this.sharedSphereGeo = new THREE.SphereGeometry(1, 12, 12);
    this.sharedCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 10);

    // 2. Pre-allocate joint meshes for all 25 XR hand joints
    for (const jointName of XR_HAND_JOINTS) {
      const isTip = jointName === 'index-finger-tip' || jointName === 'thumb-tip';
      const mesh = new THREE.Mesh(
        this.sharedSphereGeo,
        isTip ? this.tipMaterial : this.jointMaterial
      );
      const r = JOINT_RADII[jointName] || 0.005;
      mesh.scale.set(r, r, r);
      mesh.name = `${handedness}_${jointName}`;
      mesh.visible = false;
      this.jointMeshes.set(jointName, mesh);
      this.group.add(mesh);
    }

    // 3. Pre-allocate solid 3D cylinder bone segments connecting all joints
    for (let i = 0; i < ALL_CONNECTIONS.length; i++) {
      const boneMesh = new THREE.Mesh(this.sharedCylinderGeo, this.boneMaterial);
      boneMesh.name = `${handedness}_bone_${i}`;
      boneMesh.visible = false;
      this.boneMeshes.push(boneMesh);
      this.group.add(boneMesh);
    }

    // 4. Subtle pinch contact glow indicator
    const pinchGeo = new THREE.SphereGeometry(0.007, 12, 12);
    this.pinchIndicator = new THREE.Mesh(pinchGeo, this.pinchMaterial);
    this.pinchIndicator.visible = false;
    this.group.add(this.pinchIndicator);
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  public updateJoints(
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    hand: XRHand
  ): {
    detected: boolean;
    validJoints: number;
    pinchDistance: number | null;
    isPinching: boolean;
    indexTip?: THREE.Vector3;
    thumbTip?: THREE.Vector3;
    wrist?: THREE.Vector3;
  } {
    let validCount = 0;
    const jointPositions = new Map<XRHandJointName, THREE.Vector3>();

    // 1. Position all 25 joint spheres
    for (const jointName of XR_HAND_JOINTS) {
      const jointMesh = this.jointMeshes.get(jointName);
      if (!jointMesh) continue;

      let xrJoint = null;
      if (typeof (hand as any).get === 'function') {
        xrJoint = (hand as any).get(jointName);
        if (!xrJoint) {
          const jointIdx = XR_HAND_JOINTS.indexOf(jointName);
          if (jointIdx !== -1) {
            xrJoint = (hand as any).get(jointIdx);
          }
        }
      }
      if (!xrJoint && (hand as any)[jointName]) {
        xrJoint = (hand as any)[jointName];
      }

      if (!xrJoint) {
        jointMesh.visible = false;
        continue;
      }

      const pose = frame.getJointPose ? frame.getJointPose(xrJoint, referenceSpace) : null;
      if (pose) {
        const pos = pose.transform.position;
        const rot = pose.transform.orientation;

        jointMesh.position.set(pos.x, pos.y, pos.z);
        jointMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

        const baseR = JOINT_RADII[jointName] || 0.005;
        const r = pose.radius ? Math.max(0.004, pose.radius) : baseR;
        jointMesh.scale.set(r, r, r);
        jointMesh.visible = true;

        validCount++;
        jointPositions.set(jointName, jointMesh.position.clone());
      } else {
        jointMesh.visible = false;
      }
    }

    // 2. Position and orient solid 3D bone cylinders connecting the joints
    if (validCount > 4) {
      for (let i = 0; i < ALL_CONNECTIONS.length; i++) {
        const [jointA, jointB] = ALL_CONNECTIONS[i];
        const boneMesh = this.boneMeshes[i];
        const posA = jointPositions.get(jointA);
        const posB = jointPositions.get(jointB);

        if (posA && posB) {
          _vecA.copy(posA);
          _vecB.copy(posB);
          _mid.copy(_vecA).add(_vecB).multiplyScalar(0.5);
          _dir.copy(_vecB).sub(_vecA);
          const len = _dir.length();

          if (len > 0.001) {
            boneMesh.position.copy(_mid);
            _dir.normalize();
            boneMesh.quaternion.setFromUnitVectors(_unitY, _dir);

            const rA = JOINT_RADII[jointA] || 0.005;
            const rB = JOINT_RADII[jointB] || 0.005;
            const boneRadius = Math.min(rA, rB) * 0.90;

            boneMesh.scale.set(boneRadius, len, boneRadius);
            boneMesh.visible = true;
          } else {
            boneMesh.visible = false;
          }
        } else {
          boneMesh.visible = false;
        }
      }
    } else {
      for (const boneMesh of this.boneMeshes) {
        boneMesh.visible = false;
      }
    }

    // 3. Pinch gesture calculation
    const indexTip = jointPositions.get('index-finger-tip');
    const thumbTip = jointPositions.get('thumb-tip');
    const wrist = jointPositions.get('wrist');

    let pinchDist: number | null = null;
    let pinching = false;

    if (indexTip && thumbTip) {
      pinchDist = indexTip.distanceTo(thumbTip);
      pinching = pinchDist < 0.032; // Generous 32mm physical pinch threshold

      const indexMesh = this.jointMeshes.get('index-finger-tip');
      const thumbMesh = this.jointMeshes.get('thumb-tip');

      if (pinching) {
        if (indexMesh) indexMesh.material = this.pinchMaterial;
        if (thumbMesh) thumbMesh.material = this.pinchMaterial;

        this.pinchIndicator.position.copy(indexTip).add(thumbTip).multiplyScalar(0.5);
        this.pinchIndicator.visible = true;
      } else {
        if (indexMesh) indexMesh.material = this.tipMaterial;
        if (thumbMesh) thumbMesh.material = this.tipMaterial;

        this.pinchIndicator.visible = false;
      }
    } else {
      this.pinchIndicator.visible = false;
    }

    this.isPinching = pinching;

    return {
      detected: validCount > 8,
      validJoints: validCount,
      pinchDistance: pinchDist,
      isPinching: pinching,
      indexTip,
      thumbTip,
      wrist,
    };
  }

  public dispose() {
    this.sharedSphereGeo.dispose();
    this.sharedCylinderGeo.dispose();
    this.jointMaterial.dispose();
    this.boneMaterial.dispose();
    this.tipMaterial.dispose();
    this.pinchMaterial.dispose();
    this.pinchIndicator.geometry.dispose();
  }
}
