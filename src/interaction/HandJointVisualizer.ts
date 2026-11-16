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

// Skeletal bone connections for visualization
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

export class HandJointVisualizer {
  public group: THREE.Group;
  public handedness: 'left' | 'right';
  private jointMeshes: Map<XRHandJointName, THREE.Mesh> = new Map();
  private boneLines: THREE.LineSegments;
  private bonePositions: Float32Array;
  public isPinching: boolean = false;
  private pinchIndicator: THREE.Mesh;

  private jointMaterial: THREE.MeshStandardMaterial;
  private tipMaterial: THREE.MeshStandardMaterial;
  private pinchMaterial: THREE.MeshStandardMaterial;

  constructor(handedness: 'left' | 'right') {
    this.handedness = handedness;
    this.group = new THREE.Group();
    this.group.name = `HandVisualizer_${handedness}`;

    const baseColor = handedness === 'left' ? 0x38bdf8 : 0x818cf8; // cyan / indigo
    this.jointMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.3,
      metalness: 0.8,
      emissive: baseColor,
      emissiveIntensity: 0.2,
    });

    this.tipMaterial = new THREE.MeshStandardMaterial({
      color: 0x34d399, // emerald tip
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x34d399,
      emissiveIntensity: 0.4,
    });

    this.pinchMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // amber gold pinch highlight
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
    });

    const jointGeo = new THREE.SphereGeometry(0.007, 16, 16);
    const tipGeo = new THREE.SphereGeometry(0.009, 16, 16);

    for (const jointName of XR_HAND_JOINTS) {
      const isTip = jointName.endsWith('-tip');
      const mesh = new THREE.Mesh(isTip ? tipGeo : jointGeo, isTip ? this.tipMaterial : this.jointMaterial);
      mesh.name = `${handedness}_${jointName}`;
      mesh.visible = false;
      this.jointMeshes.set(jointName, mesh);
      this.group.add(mesh);
    }

    // Bone lines
    this.bonePositions = new Float32Array(BONE_CONNECTIONS.length * 6);
    const boneGeometry = new THREE.BufferGeometry();
    boneGeometry.setAttribute('position', new THREE.BufferAttribute(this.bonePositions, 3));
    const boneMaterial = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    this.boneLines = new THREE.LineSegments(boneGeometry, boneMaterial);
    this.group.add(this.boneLines);

    // Pinch line / sphere between thumb and index tip
    const pinchGeo = new THREE.SphereGeometry(0.012, 16, 16);
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

    for (const jointName of XR_HAND_JOINTS) {
      const jointMesh = this.jointMeshes.get(jointName);
      if (!jointMesh) continue;

      // Access joint from XRHand (robust across Safari visionOS and Chromium WebXR)
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

        // Adjust mesh scale if radius is reported
        if (pose.radius) {
          const s = Math.max(0.005, pose.radius * 2);
          jointMesh.scale.set(s, s, s);
        }

        jointMesh.visible = true;
        validCount++;
        jointPositions.set(jointName, jointMesh.position.clone());
      } else {
        jointMesh.visible = false;
      }
    }

    // Update skeletal bone connection lines
    if (validCount > 0) {
      let lineIdx = 0;
      for (const [fromJoint, toJoint] of BONE_CONNECTIONS) {
        const fromPos = jointPositions.get(fromJoint);
        const toPos = jointPositions.get(toJoint);
        if (fromPos && toPos) {
          this.bonePositions[lineIdx++] = fromPos.x;
          this.bonePositions[lineIdx++] = fromPos.y;
          this.bonePositions[lineIdx++] = fromPos.z;
          this.bonePositions[lineIdx++] = toPos.x;
          this.bonePositions[lineIdx++] = toPos.y;
          this.bonePositions[lineIdx++] = toPos.z;
        } else {
          lineIdx += 6;
        }
      }
      this.boneLines.geometry.attributes.position.needsUpdate = true;
      this.boneLines.visible = true;
    } else {
      this.boneLines.visible = false;
    }

    // Calculate pinch distance between index-finger-tip and thumb-tip
    const indexTip = jointPositions.get('index-finger-tip');
    const thumbTip = jointPositions.get('thumb-tip');
    const wrist = jointPositions.get('wrist');

    let pinchDist: number | null = null;
    let pinching = false;

    if (indexTip && thumbTip) {
      pinchDist = indexTip.distanceTo(thumbTip);
      // Pinch threshold ~25mm
      pinching = pinchDist < 0.028;

      if (pinching) {
        this.pinchIndicator.position.copy(indexTip).add(thumbTip).multiplyScalar(0.5);
        this.pinchIndicator.visible = true;
      } else {
        this.pinchIndicator.visible = false;
      }
    } else {
      this.pinchIndicator.visible = false;
    }

    this.isPinching = pinching;

    return {
      detected: validCount > 10,
      validJoints: validCount,
      pinchDistance: pinchDist,
      isPinching: pinching,
      indexTip,
      thumbTip,
      wrist,
    };
  }

  public dispose() {
    this.jointMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
    });
    this.jointMaterial.dispose();
    this.tipMaterial.dispose();
    this.pinchMaterial.dispose();
    this.boneLines.geometry.dispose();
    (this.boneLines.material as THREE.Material).dispose();
    this.pinchIndicator.geometry.dispose();
  }
}
