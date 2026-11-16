import React, { useEffect, useRef } from 'react';
import { InputAbstraction } from '../interaction/InputAbstraction';
import { Milestone1Scene } from '../scenes/Milestone1Scene';
import { WebXRManager } from '../interaction/WebXRManager';
import type { WebXRDiagnostics } from '../types/interaction';

interface Props {
  onDiagnosticsUpdate: (diag: WebXRDiagnostics) => void;
  onManagerReady: (manager: WebXRManager) => void;
  onSceneReady?: (scene: Milestone1Scene) => void;
}

export const LaboratoryCanvas: React.FC<Props> = ({ onDiagnosticsUpdate, onManagerReady, onSceneReady }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const inputAbstraction = new InputAbstraction();
    const scene = new Milestone1Scene(canvasRef.current, inputAbstraction);
    const webxrManager = new WebXRManager(
      scene.renderer,
      scene.scene,
      inputAbstraction,
      onDiagnosticsUpdate
    );

    onManagerReady(webxrManager);
    if (onSceneReady) {
      onSceneReady(scene);
    }

    // Three.js WebXR-compatible animation loop
    scene.renderer.setAnimationLoop((_timestamp, frame) => {
      // 1. Process spatial WebXR inputs (hands, transient pointers)
      webxrManager.update(frame || null);

      // 2. Process scene dynamics, wire drag tracking, and interactions
      scene.update(!!webxrManager.xrSession);

      // 3. Render frame
      scene.render();
    });

    return () => {
      scene.renderer.setAnimationLoop(null);
      webxrManager.dispose();
      scene.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
    </div>
  );
};
