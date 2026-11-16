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
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-2 sm:px-4 lg:px-6 py-2 sm:py-3 pointer-events-none gap-1.5 sm:gap-2">
      {/* Left branding */}
      <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-xl shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="text-[9px] sm:text-[11px] font-bold tracking-wider sm:tracking-widest text-cyan-400 uppercase truncate">
            <span className="hidden sm:inline">BITS Pilani • </span>Engineering Lab
          </span>
        </div>
        <h1 className="text-xs sm:text-base lg:text-lg font-extrabold tracking-tight text-white mt-0.5 truncate">
          OHM'S LAW <span className="text-cyan-400 font-light hidden sm:inline">|</span>{' '}
          <span className="hidden md:inline text-slate-300 font-semibold text-xs lg:text-sm">VIRTUAL LAB</span>
        </h1>
      </div>

      {/* Center Mode Switcher for Desktop / Mobile */}
      <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl p-1 shadow-xl shrink-0">
        <button
          type="button"
          onClick={() => onSelectMode('tutorial')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition ${
            currentMode === 'tutorial'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Tutorial Mode"
        >
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Tutorial</span>
          <span className="hidden lg:inline"> Mode</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('experimental')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition ${
            currentMode === 'experimental'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Experimental Mode"
        >
          <TestTube className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Experimental</span>
          <span className="hidden lg:inline"> Mode</span>
        </button>
      </div>

      {/* Right controls */}
      <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Audio Toggle button */}
        <button
          type="button"
          onClick={onToggleAudio}
          className={`p-1.5 sm:p-2 rounded-xl border backdrop-blur-md shadow transition shrink-0 ${
            isMuted
              ? 'bg-slate-800/80 text-slate-500 border-slate-700 hover:text-slate-300'
              : 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60 hover:bg-cyan-900/80'
          }`}
          title={isMuted ? 'Unmute Laboratory Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* How to Use button */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white border border-cyan-400/50 backdrop-blur-md shadow-lg shadow-cyan-600/20 transition group shrink-0"
          title="How to Use Lab (Press H)"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-200 group-hover:scale-110 transition-transform shrink-0" />
          <span className="hidden md:inline">How to Use</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.2 bg-cyan-950/80 rounded font-mono text-[10px] text-cyan-300 border border-cyan-700/50">
            H
          </kbd>
        </button>

        {/* Equipment Info button */}
        <button
          type="button"
          onClick={onOpenEquipmentInfo}
          className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md shadow transition shrink-0"
          title="Equipment Datasheet"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden xl:inline">Equipment</span>
        </button>

        {/* Safety button */}
        <button
          type="button"
          onClick={onOpenSafetyInfo}
          className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md shadow transition shrink-0"
          title="Safety Instructions"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden xl:inline">Safety</span>
        </button>

        {/* Vision Pro Guide button */}
        <button
          type="button"
          onClick={onOpenGuide}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md shadow transition shrink-0"
          title="WebXR & Apple Vision Pro Guide"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden lg:inline">WebXR</span>
        </button>

        {/* Enter WebXR button */}
        <button
          type="button"
          onClick={onEnterVR}
          disabled={!isXRSupported}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-xl tracking-wide uppercase transition shadow-2xl backdrop-blur-md border shrink-0 ${
            isXRSupported
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border-cyan-400/50 shadow-cyan-500/20 cursor-pointer animate-pulse'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/50 cursor-not-allowed'
          }`}
        >
          <Glasses className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>
            {diagnostics.sessionActive
              ? 'In WebXR'
              : isXRSupported
              ? 'Enter VR'
              : 'Desktop'}
          </span>
          {isXRSupported && <Sparkles className="w-3 h-3 text-amber-300 hidden sm:inline shrink-0" />}
        </button>
      </div>
    </header>
  );
};
