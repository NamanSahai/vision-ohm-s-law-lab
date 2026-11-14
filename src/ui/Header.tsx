import React from 'react';
import type { WebXRDiagnostics } from '../types/interaction';
import type { ExperimentMode } from '../types/circuit';
import {
  Glasses,
  Info,
  Sparkles,
  GraduationCap,
  TestTube,
  BookOpen,
  ShieldAlert,
  HelpCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface Props {
  diagnostics: WebXRDiagnostics;
  currentMode: ExperimentMode;
  isMuted: boolean;
  onToggleAudio: () => void;
  onSelectMode: (mode: ExperimentMode) => void;
  onEnterVR: () => void;
  onOpenHelp: () => void;
  onOpenGuide: () => void;
  onOpenEquipmentInfo: () => void;
  onOpenSafetyInfo: () => void;
}

export const Header: React.FC<Props> = ({
  diagnostics,
  currentMode,
  isMuted,
  onToggleAudio,
  onSelectMode,
  onEnterVR,
  onOpenHelp,
  onOpenGuide,
  onOpenEquipmentInfo,
  onOpenSafetyInfo,
}) => {
  const isXRSupported = diagnostics.immersiveVrSupported === true;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 pointer-events-none">
      {/* Left branding */}
      <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-2xl px-5 py-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
            BITS Pilani • Engineering Laboratory
          </span>
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-white mt-0.5">
          OHM'S LAW <span className="text-cyan-400 font-light">|</span> VIRTUAL ELECTRICAL LABORATORY
        </h1>
      </div>

      {/* Center Mode Switcher for Desktop */}
      <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-2xl p-1 shadow-xl">
        <button
          type="button"
          onClick={() => onSelectMode('tutorial')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            currentMode === 'tutorial'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Tutorial Mode</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('experimental')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            currentMode === 'experimental'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TestTube className="w-3.5 h-3.5" />
          <span>Experimental Mode</span>
        </button>
      </div>

      {/* Right controls */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Audio Toggle button */}
        <button
          type="button"
          onClick={onToggleAudio}
          className={`p-2 rounded-xl border backdrop-blur-md shadow transition ${
            isMuted
              ? 'bg-slate-800/80 text-slate-500 border-slate-700 hover:text-slate-300'
              : 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60 hover:bg-cyan-900/80'
          }`}
          title={isMuted ? 'Unmute Laboratory Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* How to Use button */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white border border-cyan-400/50 backdrop-blur-md shadow-lg shadow-cyan-600/20 transition group"
          title="How to Use Lab (Press H)"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-200 group-hover:scale-110 transition-transform" />
          <span>How to Use</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-cyan-950/80 rounded font-mono text-[10px] text-cyan-300 border border-cyan-700/50">
            H
          </kbd>
        </button>

        {/* Equipment Info button */}
        <button
          type="button"
          onClick={onOpenEquipmentInfo}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md shadow transition"
          title="Equipment Datasheet"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">Equipment</span>
        </button>

        {/* Safety button */}
        <button
          type="button"
          onClick={onOpenSafetyInfo}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md shadow transition"
          title="Safety Instructions"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Safety</span>
        </button>

        {/* Vision Pro Guide button */}
        <button
          type="button"
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md shadow transition"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>WebXR</span>
        </button>

        {/* Enter WebXR button */}
        <button
          type="button"
          onClick={onEnterVR}
          disabled={!isXRSupported}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl tracking-wide uppercase transition shadow-2xl backdrop-blur-md border ${
            isXRSupported
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border-cyan-400/50 shadow-cyan-500/20 cursor-pointer animate-pulse'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/50 cursor-not-allowed'
          }`}
        >
          <Glasses className="w-4 h-4" />
          <span>
            {diagnostics.sessionActive
              ? 'In WebXR Session'
              : isXRSupported
              ? 'Enter WebXR'
              : 'Desktop Mode'}
          </span>
          {isXRSupported && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
        </button>
      </div>
    </header>
  );
};
