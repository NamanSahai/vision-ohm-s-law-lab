import * as THREE from 'three';
import { HandJointVisualizer } from './HandJointVisualizer';
import { TransientPointerVisualizer } from './TransientPointerVisualizer';
import { InputAbstraction } from './InputAbstraction';
import { labAudio } from '../audio/LabSoundSynthesizer';
import type { WebXRDiagnostics, HandStatus } from '../types/interaction';

export class WebXRManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private inputAbstraction: InputAbstraction;

  public xrSession: XRSession | null = null;
  public xrRefSpace: XRReferenceSpace | null = null;

  // Hand visualizers
  private leftHandVisualizer: HandJointVisualizer;
  private rightHandVisualizer: HandJointVisualizer;

  // Native Three.js Hand and Controller tracking
  private hand0: THREE.XRHandSpace;
  private hand1: THREE.XRHandSpace;
  private controller0: THREE.XRTargetRaySpace;
  private controller1: THREE.XRTargetRaySpace;

  // Transient pointer visualizers (gaze & pinch fallback)
  private transientPointerVisualizers: TransientPointerVisualizer[] = [];

  // Active pointers map
  private activePointerInputs: Map<XRInputSource, {
    visualizer: TransientPointerVisualizer;
    isPinching: boolean;
    id: string;
  }> = new Map();

  // Diagnostics state
  private diagnostics: WebXRDiagnostics = {
    isSecureContext: window.isSecureContext,
    hasNavigatorXR: 'xr' in navigator,
    immersiveVrSupported: null,
    checkingSupport: true,
    sessionActive: false,
    inputSourceCount: 0,
    inputMode: 'desktop-mouse',
    leftHand: { handedness: 'left', detected: false, jointCount: 0, pinchDistance: null, isPinching: false },
    rightHand: { handedness: 'right', detected: false, jointCount: 0, pinchDistance: null, isPinching: false },
    transientPointersActive: 0,
    fps: 0,
    lastError: null,
  };

  private onDiagnosticsChange?: (diag: WebXRDiagnostics) => void;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    inputAbstraction: InputAbstraction,
    onDiagnosticsChange?: (diag: WebXRDiagnostics) => void
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.inputAbstraction = inputAbstraction;
    this.onDiagnosticsChange = onDiagnosticsChange;

    this.renderer.xr.enabled = true;

    // Create hand joint visualizers
    this.leftHandVisualizer = new HandJointVisualizer('left');
    this.rightHandVisualizer = new HandJointVisualizer('right');
    this.scene.add(this.leftHandVisualizer.group);
    this.scene.add(this.rightHandVisualizer.group);

    // Native WebXR Hand tracking
    this.hand0 = this.renderer.xr.getHand(0);
    this.scene.add(this.hand0);

    this.hand1 = this.renderer.xr.getHand(1);
    this.scene.add(this.hand1);

    // Native WebXR Controllers (for target ray spaces)
    this.controller0 = this.renderer.xr.getController(0);
    this.scene.add(this.controller0);

    this.controller1 = this.renderer.xr.getController(1);
    this.scene.add(this.controller1);

    // Check device WebXR capabilities
    this.checkSupport();
  }

  public async checkSupport() {
    this.diagnostics.isSecureContext = window.isSecureContext;
    this.diagnostics.hasNavigatorXR = 'xr' in navigator;

    if (!this.diagnostics.hasNavigatorXR) {
      this.diagnostics.immersiveVrSupported = false;
      this.diagnostics.checkingSupport = false;
      this.diagnostics.lastError = 'WebXR Device API is not available in this browser context.';
      this.emitDiagnostics();
      return;
    }

    try {
      const vr = await navigator.xr!.isSessionSupported('immersive-vr');
      let ar = false;
      try {
        ar = await navigator.xr!.isSessionSupported('immersive-ar');
      } catch {}
      this.diagnostics.immersiveVrSupported = vr || ar;
      this.diagnostics.checkingSupport = false;
      this.emitDiagnostics();
    } catch (err: any) {
      this.diagnostics.immersiveVrSupported = false;
      this.diagnostics.checkingSupport = false;
      this.diagnostics.lastError = err?.message || 'Error checking WebXR support';
      this.emitDiagnostics();
    }
  }

  public async enterVR(): Promise<boolean> {
    if (!navigator.xr) {
      this.diagnostics.lastError = 'WebXR not available.';
      this.emitDiagnostics();
      return false;
    }

    try {
      // Prime and unlock Web Audio immediately on enterVR user gesture
      await labAudio.unlockAudio();

      // Request session with hand tracking and reference space options
      const sessionInit: XRSessionInit = {
        optionalFeatures: [
          'hand-tracking',
          'local-floor',
          'bounded-floor',
          'layers',
          'hit-test',
        ],
      };

      let session: XRSession;
      try {
        session = await navigator.xr.requestSession('immersive-vr', sessionInit);
      } catch {
        session = await navigator.xr.requestSession('immersive-ar', sessionInit);
      }
      this.xrSession = session;
      await this.renderer.xr.setSession(session);

      // Request reference space (prefer local-floor for real standing/table height)
      try {
        this.xrRefSpace = await session.requestReferenceSpace('local-floor');
      } catch {
        this.xrRefSpace = await session.requestReferenceSpace('local');
      }

      this.renderer.xr.setReferenceSpace(this.xrRefSpace);

      // Session event listeners
      session.addEventListener('end', this.onSessionEnded);
      session.addEventListener('inputsourceschange', this.onInputSourcesChange);
      session.addEventListener('selectstart', this.onSelectStart);
      session.addEventListener('selectend', this.onSelectEnd);

      this.diagnostics.sessionActive = true;
      this.diagnostics.lastError = null;
      this.emitDiagnostics();
      return true;
    } catch (err: any) {
      console.error('Failed to start WebXR session:', err);
      this.diagnostics.lastError = `WebXR Enter VR failed: ${err?.message || err}`;
      this.emitDiagnostics();
      return false;
    }
  }

  public exitVR() {
    if (this.xrSession) {
      this.xrSession.end();
    }
  }

  private onSessionEnded = () => {
    this.xrSession = null;
    this.xrRefSpace = null;
    this.diagnostics.sessionActive = false;
    this.diagnostics.inputSourceCount = 0;
    this.diagnostics.inputMode = 'desktop-mouse';
    this.leftHandVisualizer.setVisible(false);
    this.rightHandVisualizer.setVisible(false);
    this.clearTransientPointers();
    this.emitDiagnostics();
  };

  private onInputSourcesChange = (event: XRInputSourcesChangeEvent) => {
    // When transient pointers or controllers are removed, immediately clean up their visualizers
    for (const removed of event.removed) {
      const data = this.activePointerInputs.get(removed);
      if (data) {
        data.visualizer.hide();
        this.transientPointerVisualizers.push(data.visualizer);
        this.activePointerInputs.delete(removed);
        this.inputAbstraction.processPointerSelect(data.id, new THREE.Vector3(), new THREE.Vector3(), false);
      }
    }
    this.diagnostics.inputSourceCount = event.session.inputSources.length;
    this.emitDiagnostics();
  };

  private onSelectStart = (event: XRInputSourceEvent) => {
    // Prime and unlock Web Audio on every XR user gesture
    labAudio.unlockAudio();

    const inputSource = event.inputSource;
    const refSpace = this.xrRefSpace;
    if (!refSpace || !event.frame) return;

    // If this input has hand tracking, pinch is already handled by joint distance
    if (inputSource.hand) return;

    // Transient pointer / Gaze & Pinch
    const pointerData = this.getOrCreatePointerData(inputSource);
    pointerData.isPinching = true;

    const targetRayPose = event.frame.getPose(inputSource.targetRaySpace, refSpace);
    if (targetRayPose) {
      const pos = targetRayPose.transform.position;
      const orient = targetRayPose.transform.orientation;
      const origin = new THREE.Vector3(pos.x, pos.y, pos.z);
      const quat = new THREE.Quaternion(orient.x, orient.y, orient.z, orient.w);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);

      this.inputAbstraction.processPointerSelect(pointerData.id, origin, dir, true);
    }
  };

  private onSelectEnd = (event: XRInputSourceEvent) => {
    const inputSource = event.inputSource;
    if (inputSource.hand) return;

    const pointerData = this.activePointerInputs.get(inputSource);
    if (pointerData) {
      pointerData.isPinching = false;
      // Immediately hide reticle visualizer upon pinch release so it NEVER stays stuck in space
      pointerData.visualizer.hide();
      const refSpace = this.xrRefSpace;
      if (refSpace && event.frame) {
        const targetRayPose = event.frame.getPose(inputSource.targetRaySpace, refSpace);
        if (targetRayPose) {
          const pos = targetRayPose.transform.position;
          const orient = targetRayPose.transform.orientation;
          const origin = new THREE.Vector3(pos.x, pos.y, pos.z);
          const quat = new THREE.Quaternion(orient.x, orient.y, orient.z, orient.w);
          const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
          this.inputAbstraction.processPointerSelect(pointerData.id, origin, dir, false);
        }
      }
    }
  };

  private getOrCreatePointerData(inputSource: XRInputSource) {
    let data = this.activePointerInputs.get(inputSource);
    if (!data) {
      let vis = this.transientPointerVisualizers.pop();
      if (!vis) {
        vis = new TransientPointerVisualizer();
        this.scene.add(vis.group);
      }
      const id = `pointer-${Math.random().toString(36).substring(2, 7)}`;
      data = { visualizer: vis, isPinching: false, id };
      this.activePointerInputs.set(inputSource, data);
    }
    return data;
  }

  private clearTransientPointers() {
    for (const [, data] of this.activePointerInputs) {
      data.visualizer.hide();
      this.transientPointerVisualizers.push(data.visualizer);
    }
    this.activePointerInputs.clear();
  }

  // Called inside renderer.setAnimationLoop
  public update(frame: XRFrame | null) {
    // Calculate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.diagnostics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
      this.emitDiagnostics();
    }

    if (!frame || !this.xrSession || !this.xrRefSpace) {
      return;
    }

    const inputSources = this.xrSession.inputSources;
    this.diagnostics.inputSourceCount = inputSources.length;

    // Prune stale transient pointers whose XRInputSource is no longer present
    const currentSources = new Set(inputSources);
    for (const [source, data] of this.activePointerInputs.entries()) {
      if (!currentSources.has(source)) {
        data.visualizer.hide();
        this.transientPointerVisualizers.push(data.visualizer);
        this.activePointerInputs.delete(source);
        this.inputAbstraction.processPointerSelect(data.id, new THREE.Vector3(), new THREE.Vector3(), false);
      }
    }

    let hasHandTracking = false;
    let transientPointerCount = 0;
    let leftHandSeen = false;
    let rightHandSeen = false;

    let leftStatus: HandStatus = {
      handedness: 'left',
      detected: false,
      jointCount: 0,
      pinchDistance: null,
      isPinching: false,
    };
    let rightStatus: HandStatus = {
      handedness: 'right',
      detected: false,
      jointCount: 0,
      pinchDistance: null,
      isPinching: false,
    };

    // Iterate through all XR input sources
    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];

      // CASE 1: Real WebXR Hand Tracking (Articulated hand joints available)
      if (inputSource.hand) {
        hasHandTracking = true;

        // Robust handedness determination across visionOS and Quest runtimes
        let handedness = inputSource.handedness;
        if (handedness !== 'left' && handedness !== 'right') {
          handedness = i === 0 ? 'left' : 'right';
        }

        if (handedness === 'left') {
          leftHandSeen = true;
          this.leftHandVisualizer.setVisible(true);
          const result = this.leftHandVisualizer.updateJoints(frame, this.xrRefSpace, inputSource.hand);

          leftStatus = {
            handedness: 'left',
            detected: result.detected,
            jointCount: result.validJoints,
            pinchDistance: result.pinchDistance ? Math.round(result.pinchDistance * 1000) : null,
            isPinching: result.isPinching,
            indexTipPosition: result.indexTip,
            thumbTipPosition: result.thumbTip,
            wristPosition: result.wrist,
          };

          const pinchPos = result.indexTip && result.thumbTip
            ? result.indexTip.clone().add(result.thumbTip).multiplyScalar(0.5)
            : null;

          this.inputAbstraction.processHandPinch('left-hand', pinchPos, result.isPinching);
        } else {
          rightHandSeen = true;
          this.rightHandVisualizer.setVisible(true);
          const result = this.rightHandVisualizer.updateJoints(frame, this.xrRefSpace, inputSource.hand);

          rightStatus = {
            handedness: 'right',
            detected: result.detected,
            jointCount: result.validJoints,
            pinchDistance: result.pinchDistance ? Math.round(result.pinchDistance * 1000) : null,
            isPinching: result.isPinching,
            indexTipPosition: result.indexTip,
            thumbTipPosition: result.thumbTip,
            wristPosition: result.wrist,
          };

          const pinchPos = result.indexTip && result.thumbTip
            ? result.indexTip.clone().add(result.thumbTip).multiplyScalar(0.5)
            : null;

          this.inputAbstraction.processHandPinch('right-hand', pinchPos, result.isPinching);
        }
      }
      // CASE 2: Transient Pointer / Gaze & Pinch Fallback (Only active when hands are not directly tracked)
      else if (inputSource.targetRaySpace) {
        transientPointerCount++;
        const pointerData = this.getOrCreatePointerData(inputSource);
        const targetRayPose = frame.getPose(inputSource.targetRaySpace, this.xrRefSpace);

        if (targetRayPose) {
          const pos = targetRayPose.transform.position;
          const orient = targetRayPose.transform.orientation;
          const origin = new THREE.Vector3(pos.x, pos.y, pos.z);
          const quat = new THREE.Quaternion(orient.x, orient.y, orient.z, orient.w);
          const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);

          // Raycast for hover or active drag
          const { hitPoint } = this.inputAbstraction.raycastPointer(origin, dir);

          pointerData.visualizer.update(origin, dir, hitPoint, pointerData.isPinching);

          if (pointerData.isPinching) {
            this.inputAbstraction.updatePointerDrag(pointerData.id, origin, dir);
          }
        } else {
          pointerData.visualizer.hide();
        }
      }
    }

    // Hide visualizers for hands that are currently lost/untracked
    if (!leftHandSeen) this.leftHandVisualizer.setVisible(false);
    if (!rightHandSeen) this.rightHandVisualizer.setVisible(false);

    // When real hands are actively tracked, suppress gaze reticles to prevent visual clutter
    if (hasHandTracking) {
      for (const data of this.activePointerInputs.values()) {
        data.visualizer.hide();
      }
    }

    // Determine current input mode
    if (hasHandTracking) {
      this.diagnostics.inputMode = 'hand-tracking';
    } else if (transientPointerCount > 0) {
      this.diagnostics.inputMode = 'transient-pointer';
    } else {
      this.diagnostics.inputMode = 'desktop-mouse';
    }

    this.diagnostics.leftHand = leftStatus;
    this.diagnostics.rightHand = rightStatus;
    this.diagnostics.transientPointersActive = transientPointerCount;
  }

  private emitDiagnostics() {
    if (this.onDiagnosticsChange) {
      this.onDiagnosticsChange({ ...this.diagnostics });
    }
  }

  public getDiagnostics(): WebXRDiagnostics {
    return { ...this.diagnostics };
  }

  public dispose() {
    this.exitVR();
    this.leftHandVisualizer.dispose();
    this.rightHandVisualizer.dispose();
    this.scene.remove(this.hand0);
    this.scene.remove(this.hand1);
    this.scene.remove(this.controller0);
    this.scene.remove(this.controller1);
    this.transientPointerVisualizers.forEach((v) => v.dispose());
  }
}
