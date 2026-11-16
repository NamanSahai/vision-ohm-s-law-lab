import React from 'react';
import { Camera, Eye, Cpu, Gauge, BookOpen, Crosshair } from 'lucide-react';

export type CameraPreset = 'overview' | 'circuit' | 'powersupply' | 'meters' | 'blackboard';

interface Props {
  activePreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
  isPointerLocked?: boolean;
  onTogglePointerLock?: () => void;
}

export const CameraPresetsBar: React.FC<Props> = ({
  activePreset,
  onSelectPreset,
  isPointerLocked = false,
  onTogglePointerLock,
}) => {
  const presets: { id: CameraPreset; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'circuit', label: 'Circuit Focus', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'powersupply', label: 'Power Supply', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'meters', label: 'Meters View', icon: <Gauge className="w-3.5 h-3.5" /> },
    { id: 'blackboard', label: 'Theory Board', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed top-16 sm:top-20 left-2 sm:left-4 z-30 flex flex-col gap-1 sm:gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 sm:p-2 shadow-2xl text-xs font-sans">
      <div className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5">
        Camera Views
      </div>
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelectPreset(p.id)}
          className={`flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition text-left ${
            activePreset === p.id
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={p.label}
        >
          {p.icon}
          <span className="hidden sm:inline">{p.label}</span>
        </button>
      ))}

      {onTogglePointerLock && (
        <>
          <div className="h-px bg-slate-800 my-0.5" />
          <button
            type="button"
            onClick={onTogglePointerLock}
            className={`flex items-center justify-between p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition text-left border ${
              isPointerLocked
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                : 'text-amber-300 bg-amber-950/30 border-amber-800/40 hover:bg-amber-900/40 hover:text-amber-200'
            }`}
            title="Toggle First-Person Free Look mode (Mouse turns view, WASD moves, Scroll zooms)"
          >
            <div className="flex items-center gap-2">
              <Crosshair className={`w-3.5 h-3.5 ${isPointerLocked ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isPointerLocked ? 'Free Look ON' : 'Free Look'}</span>
            </div>
            <kbd className="hidden sm:inline-block text-[9px] px-1 py-0.2 rounded bg-slate-800/80 border border-slate-700 font-mono text-slate-300">
              F
            </kbd>
          </button>
        </>
      )}
    </div>
  );
};
