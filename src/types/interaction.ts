import * as THREE from 'three';

export type InputMode = 'hand-tracking' | 'transient-pointer' | 'tracked-pointer' | 'desktop-mouse';

export interface HandJointInfo {
  name: string;
  position: THREE.Vector3;
  valid: boolean;
}

export interface HandStatus {
  handedness: 'left' | 'right' | 'none';
  detected: boolean;
  jointCount: number;
  pinchDistance: number | null;
  isPinching: boolean;
  wristPosition?: THREE.Vector3;
  indexTipPosition?: THREE.Vector3;
  thumbTipPosition?: THREE.Vector3;
}

export interface WebXRDiagnostics {
  isSecureContext: boolean;
  hasNavigatorXR: boolean;
  immersiveVrSupported: boolean | null;
  checkingSupport: boolean;
  sessionActive: boolean;
  inputSourceCount: number;
  inputMode: InputMode;
  leftHand: HandStatus;
  rightHand: HandStatus;
  transientPointersActive: number;
  fps: number;
  lastError: string | null;
}

export interface InteractableObject3D extends THREE.Object3D {
  isInteractable?: boolean;
  isHovered?: boolean;
  isGrabbed?: boolean;
  grabberId?: string | null;
  originalPosition?: THREE.Vector3;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onGrabStart?: (grabberPosition: THREE.Vector3) => void;
  onGrabMove?: (grabberPosition: THREE.Vector3, delta?: THREE.Vector3) => void;
  onGrabEnd?: () => void;
}
