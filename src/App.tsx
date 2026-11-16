import { useState, useRef, useEffect } from 'react';
import { LaboratoryCanvas } from './components/LaboratoryCanvas';
import { Header } from './ui/Header';
import { DiagnosticsOverlay } from './ui/DiagnosticsOverlay';
import { VisionProGuideModal } from './ui/VisionProGuideModal';
import { ApparatusInspectorModal } from './ui/ApparatusInspectorModal';
import { QuickHelpModal } from './ui/QuickHelpModal';
import { PowerSupplyController } from './ui/DesktopHUD/PowerSupplyController';
import { ObservationDrawer } from './ui/DesktopHUD/ObservationDrawer';
import { WireToolbar } from './ui/DesktopHUD/WireToolbar';
import { TutorialStepCard } from './ui/DesktopHUD/TutorialStepCard';
import { CameraPresetsBar } from './ui/DesktopHUD/CameraPresetsBar';
import { CircuitStatusBanner } from './ui/DesktopHUD/CircuitStatusBanner';
import type { CameraPreset } from './ui/DesktopHUD/CameraPresetsBar';

import { labAudio } from './audio/LabSoundSynthesizer';
import { ElectricalEngine } from './simulation/ElectricalEngine';
import type { WebXRDiagnostics } from './types/interaction';
import type { WebXRManager } from './interaction/WebXRManager';
import type { Milestone1Scene } from './scenes/Milestone1Scene';
import type {
  CircuitStatus,
  ObservationReading,
  ExperimentMode,
  WireColor,
  WireConnection,
  TerminalId,
} from './types/circuit';

export function App() {
  const [manager, setManager] = useState<WebXRManager | null>(null);
  const [scene, setScene] = useState<Milestone1Scene | null>(null);

  // Modals
  const [isMuted, setIsMuted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'equipment' | 'safety'>('equipment');

  // Experiment Mode
  const [currentMode, setCurrentMode] = useState<ExperimentMode>('tutorial');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('overview');
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [crosshairAction, setCrosshairAction] = useState<string | null>(null);

  // Wire System State
  const [activeWireColor, setActiveWireColor] = useState<WireColor>('red');
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalId | null>(null);
  const [wires, setWires] = useState<WireConnection[]>([]);

  // Simulation Engine Reference
  const engineRef = useRef<ElectricalEngine>(new ElectricalEngine());
  const [circuitStatus, setCircuitStatus] = useState<CircuitStatus>(engineRef.current.solve());

  // Observation Table Readings
  const [readings, setReadings] = useState<ObservationReading[]>([]);

  // WebXR Diagnostics
  const [diagnostics, setDiagnostics] = useState<WebXRDiagnostics>({
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
    fps: 60,
    lastError: null,
  });

  // Global Keyboard Shortcuts (H, ?, K, Space, 1-5, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'KeyH' || e.key === '?') {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        return;
      }

      if (e.code === 'Escape') {
        setHelpOpen(false);
        setGuideOpen(false);
        setInspectorOpen(false);
        if (scene) scene.clearSelectedTerminal();
        return;
      }

      if (e.code === 'KeyK') {
        handleToggleSwitch();
        return;
      }

      if (e.code === 'KeyF') {
        e.preventDefault();
        if (scene) scene.togglePointerLock();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePower();
        return;
      }

      if (e.code === 'Digit1') handleSelectCameraPreset('overview');
      if (e.code === 'Digit2') handleSelectCameraPreset('circuit');
      if (e.code === 'Digit3') handleSelectCameraPreset('powersupply');
      if (e.code === 'Digit4') handleSelectCameraPreset('meters');
      if (e.code === 'Digit5') handleSelectCameraPreset('blackboard');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scene, circuitStatus]);

  // Bind scene callbacks when scene is ready
  useEffect(() => {
    if (!scene) return;

    scene.onWiresChanged = (newWires) => {
      setWires(newWires);
      const status = engineRef.current.setWires(newWires);
      setCircuitStatus(status);
    };

    scene.onTerminalSelected = (termId) => {
      setSelectedTerminal(termId);
    };

    scene.onToggleSwitch = () => {
      handleToggleSwitch();
    };

    scene.onTogglePower = () => {
      handleTogglePower();
    };

    scene.onPointerLockChange = (locked) => {
      setIsPointerLocked(locked);
    };

    scene.onCrosshairActionChange = (action) => {
      setCrosshairAction(action);
    };
  }, [scene]);

  // Synchronize 3D apparatus readouts and switch state with simulation status
  useEffect(() => {
    if (scene) {
      scene.updateCircuitState(circuitStatus);
    }
  }, [scene, circuitStatus]);

  // Electrical Engine Controls
  const handleTogglePower = () => {
    labAudio.playPowerSwitch(!engineRef.current.isPowerOn);
    const status = engineRef.current.setPowerOn(!engineRef.current.isPowerOn);
    setCircuitStatus(status);
  };

  const handleToggleSwitch = () => {
    if (engineRef.current.isSwitchClosed) {
      labAudio.playKnifeSwitchOpen();
    } else {
      labAudio.playKnifeSwitchClose();
    }
    const status = engineRef.current.setSwitchClosed(!engineRef.current.isSwitchClosed);
    setCircuitStatus(status);
  };

  const handleVoltageChange = (voltage: number) => {
    labAudio.playKnobTick();
    const status = engineRef.current.setVoltage(voltage);
    setCircuitStatus(status);
  };

  const handleAutoWire = () => {
    if (scene) {
      labAudio.playWirePlug();
      scene.autoWireCorrectCircuit();
    }
  };

  const handleClearWires = () => {
    if (scene) {
      labAudio.playWireUnplug();
      scene.wireManager.clearAllWires();
      setSelectedTerminal(null);
    }
  };

  const handleRemoveWire = (wireId: string) => {
    if (scene) {
      labAudio.playWireUnplug();
      scene.wireManager.removeWire(wireId);
    }
  };

  const handleHoverWire = (wireId: string | null) => {
    if (scene) {
      scene.wireManager.setHoveredWire(wireId);
    }
  };

  const handleSelectWireColor = (color: WireColor) => {
    setActiveWireColor(color);
    if (scene) {
      scene.wireManager.setActiveWireColor(color);
    }
  };

  // Camera Presets
  const handleSelectCameraPreset = (preset: CameraPreset) => {
    setActiveCameraPreset(preset);
    if (scene) {
      scene.setCameraPreset(preset);
    }
  };

  // Observation Table Handlers
  const handleAddReading = () => {
    if (!circuitStatus.isPowerOn || !circuitStatus.isCircuitClosed) return;

    const newReading: ObservationReading = {
      id: `reading_${Date.now()}`,
      readingNumber: readings.length + 1,
      voltage: Math.round(circuitStatus.voltmeterReading * 100) / 100,
      current: Math.round(circuitStatus.ammeterReading * 10) / 10,
      resistance:
        circuitStatus.circuitCurrent > 0.0001
          ? Math.round((circuitStatus.voltmeterReading / (circuitStatus.ammeterReading / 1000.0)) * 10) / 10
          : 0,
      timestamp: new Date().toLocaleTimeString(),
    };

    setReadings([...readings, newReading]);
  };

  const handleDeleteReading = (id: string) => {
    const filtered = readings
      .filter((r) => r.id !== id)
      .map((r, idx) => ({ ...r, readingNumber: idx + 1 }));
    setReadings(filtered);
  };

  const handleClearReadings = () => {
    setReadings([]);
  };

  const handleEnterVR = () => {
    labAudio.unlockAudio();
    if (manager) {
      manager.enterVR();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL / WebXR Laboratory Canvas */}
      <LaboratoryCanvas
        onDiagnosticsUpdate={setDiagnostics}
        onManagerReady={setManager}
        onSceneReady={setScene}
      />

      {/* Top Header Bar with Mode Selector & Institutional Branding */}
      <Header
        diagnostics={diagnostics}
        currentMode={currentMode}
        isMuted={isMuted}
        onToggleAudio={() => {
          labAudio.setMuted(!isMuted);
          setIsMuted(!isMuted);
        }}
        onSelectMode={setCurrentMode}
        onEnterVR={handleEnterVR}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenGuide={() => setGuideOpen(true)}
        onOpenEquipmentInfo={() => {
          setInspectorTab('equipment');
          setInspectorOpen(true);
        }}
        onOpenSafetyInfo={() => {
          setInspectorTab('safety');
          setInspectorOpen(true);
        }}
      />

      {/* Live Circuit Topology & Flow Banner (Center Top) */}
      <CircuitStatusBanner
        circuitStatus={circuitStatus}
        onTogglePower={handleTogglePower}
        onToggleSwitch={handleToggleSwitch}
      />

      {/* Camera Presets Sidebar (Left) */}
      <CameraPresetsBar
        activePreset={activeCameraPreset}
        onSelectPreset={handleSelectCameraPreset}
        isPointerLocked={isPointerLocked}
        onTogglePointerLock={() => scene?.togglePointerLock()}
      />

      {/* First-Person Free Look Center Crosshair & Interactive Reticle */}
      {isPointerLocked && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          {/* Center Crosshair Dot & Hover Ring */}
          <div className="relative flex items-center justify-center">
            <div
              className={`rounded-full border transition-all duration-150 ${
                crosshairAction
                  ? 'w-7 h-7 border-cyan-400 bg-cyan-400/20 scale-125 shadow-lg shadow-cyan-400/60 animate-pulse'
                  : 'w-3 h-3 border-white/80 bg-white/30 shadow'
              }`}
            />
            <div className="absolute w-1 h-1 rounded-full bg-white shadow-sm" />

            {/* Floating contextual action badge */}
            {crosshairAction && (
              <div className="absolute top-9 whitespace-nowrap px-3 py-1 rounded-full bg-slate-900/95 border border-cyan-500/80 text-cyan-300 font-sans text-xs font-bold shadow-2xl backdrop-blur-md">
                {crosshairAction}
              </div>
            )}
          </div>

          {/* Top Free Look Status Pill */}
          <div className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/60 backdrop-blur-md shadow-2xl text-xs font-sans text-slate-200">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              FREE LOOK ACTIVE
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Move mouse to look • WASD to walk • Left-click to interact • Scroll to zoom</span>
            <span className="text-slate-500">•</span>
            <button
              onClick={() => scene?.exitPointerLock()}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 text-[11px] font-mono transition"
            >
              Unlock [Esc]
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Mode Step Guide (Left of center) */}
      {currentMode === 'tutorial' && (
        <TutorialStepCard
          currentStepIndex={tutorialStep}
          onNextStep={() => setTutorialStep((prev) => Math.min(8, prev + 1))}
          onPrevStep={() => setTutorialStep((prev) => Math.max(0, prev - 1))}
          onSelectStep={setTutorialStep}
        />
      )}

      {/* Power Supply & Knife Switch Controller HUD (Right) */}
      <PowerSupplyController
        circuitStatus={circuitStatus}
        onTogglePower={handleTogglePower}
        onToggleSwitch={handleToggleSwitch}
        onVoltageChange={handleVoltageChange}
      />

      {/* Wire Patching Toolbar (Bottom Center) */}
      <WireToolbar
        activeColor={activeWireColor}
        onSelectColor={handleSelectWireColor}
        selectedTerminal={selectedTerminal}
        wires={wires}
        onAutoWireCorrectCircuit={handleAutoWire}
        onClearWires={handleClearWires}
        onRemoveWire={handleRemoveWire}
        onHoverWire={handleHoverWire}
      />

      {/* Observation Table & V-I Graph Drawer (Bottom Right) */}
      <ObservationDrawer
        readings={readings}
        circuitStatus={circuitStatus}
        onAddReading={handleAddReading}
        onDeleteReading={handleDeleteReading}
        onClearReadings={handleClearReadings}
      />

      {/* Spatial Diagnostics Overlay (Bottom Left) */}
      <DiagnosticsOverlay
        diagnostics={diagnostics}
        onOpenGuide={() => setGuideOpen(true)}
      />

      {/* Apple Vision Pro Safari Setup Modal */}
      <VisionProGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />

      {/* Quick Help / How to Use Lab Modal */}
      <QuickHelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      {/* Equipment Datasheet & Safety Modal */}
      <ApparatusInspectorModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        initialTab={inspectorTab}
      />
    </div>
  );
}

export default App;
