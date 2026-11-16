import React, { useState } from 'react';
import type { WebXRDiagnostics } from '../types/interaction';
import { Activity, ShieldCheck, ShieldAlert, Glasses, Hand, MousePointer, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  diagnostics: WebXRDiagnostics;
  onOpenGuide: () => void;
}

export const DiagnosticsOverlay: React.FC<Props> = ({ diagnostics, onOpenGuide }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={`fixed bottom-2 sm:bottom-4 left-2 sm:left-4 z-20 ${
      collapsed ? 'w-auto max-w-fit' : 'w-full max-w-[calc(100vw-1rem)] sm:max-w-sm max-h-[80vh] overflow-y-auto'
    } bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-xs font-mono overflow-hidden transition-all duration-200 pointer-events-auto`}>
      {/* Header bar */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2.5 bg-slate-800/80 cursor-pointer border-b border-slate-700/60 hover:bg-slate-800"
      >
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse shrink-0" />
          <span className="hidden 2xl:inline font-semibold text-slate-200 tracking-wider">SPATIAL DIAGNOSTICS</span>
          <span className="2xl:hidden font-semibold text-slate-200 tracking-wider text-[11px]">DIAG</span>
          <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
            {diagnostics.fps} FPS
          </span>
        </div>
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenGuide();
            }}
            className="hidden sm:flex text-[11px] text-amber-300 hover:text-amber-200 items-center gap-1 font-sans px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/50"
          >
            <Info className="w-3 h-3" /> Guide
          </button>
          {collapsed ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2.5 text-slate-300">
          {/* Environment & Protocol */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                {diagnostics.isSecureContext ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                )}
                Security (HTTPS):
              </span>
              <span className={diagnostics.isSecureContext ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {diagnostics.isSecureContext ? 'SECURE CONTEXT' : 'INSECURE (NO XR)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Glasses className="w-3.5 h-3.5 text-indigo-400" />
                WebXR Device API:
              </span>
              <span className={diagnostics.hasNavigatorXR ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {diagnostics.hasNavigatorXR ? 'AVAILABLE' : 'NOT FOUND'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Immersive VR Support:</span>
              <span className={
                diagnostics.checkingSupport ? 'text-amber-400' :
                diagnostics.immersiveVrSupported ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
              }>
                {diagnostics.checkingSupport ? 'Checking...' : diagnostics.immersiveVrSupported ? 'SUPPORTED' : 'UNSUPPORTED'}
              </span>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Active Input Mode */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active Input Pipeline:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-slate-800 border border-slate-700 text-cyan-300 flex items-center gap-1">
                {diagnostics.inputMode === 'hand-tracking' && <Hand className="w-3 h-3 text-emerald-400" />}
                {diagnostics.inputMode === 'transient-pointer' && <Glasses className="w-3 h-3 text-amber-400" />}
                {diagnostics.inputMode === 'desktop-mouse' && <MousePointer className="w-3 h-3 text-slate-300" />}
                {diagnostics.inputMode.replace('-', ' ')}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-tight">
              {diagnostics.inputMode === 'hand-tracking' && 'Real 25-joint skeletal tracking detected and active.'}
              {diagnostics.inputMode === 'transient-pointer' && 'visionOS Gaze & Pinch fallback active (transient pointer).'}
              {diagnostics.inputMode === 'desktop-mouse' && 'Desktop mode: Mouse to look around • WASD to walk • Left-click to interact • Wheel to zoom • [F] Free Look.'}
            </div>
          </div>

          {/* Hands status */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Input Sources ({diagnostics.inputSourceCount})</div>
            
            {/* Left Hand */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Left Hand:</span>
              <span className={diagnostics.leftHand.detected ? 'text-emerald-400' : 'text-slate-500'}>
                {diagnostics.leftHand.detected 
                  ? `${diagnostics.leftHand.jointCount} joints ${diagnostics.leftHand.isPinching ? '• [PINCH]' : ''}`
                  : 'Not Tracked'}
              </span>
            </div>

            {/* Right Hand */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Right Hand:</span>
              <span className={diagnostics.rightHand.detected ? 'text-emerald-400' : 'text-slate-500'}>
                {diagnostics.rightHand.detected 
                  ? `${diagnostics.rightHand.jointCount} joints ${diagnostics.rightHand.isPinching ? '• [PINCH]' : ''}`
                  : 'Not Tracked'}
              </span>
            </div>

            {diagnostics.transientPointersActive > 0 && (
              <div className="flex items-center justify-between text-[11px] text-amber-300">
                <span>Gaze/Pinch Pointers:</span>
                <span>{diagnostics.transientPointersActive} active</span>
              </div>
            )}
          </div>

          {diagnostics.lastError && (
            <div className="p-2 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[10px]">
              <strong>Notice:</strong> {diagnostics.lastError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
