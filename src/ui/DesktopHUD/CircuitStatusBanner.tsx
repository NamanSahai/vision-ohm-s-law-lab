import React from 'react';
import type { CircuitStatus } from '../../types/circuit';
import {
  Zap,
  AlertTriangle,
  Power,
  ToggleLeft,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  circuitStatus: CircuitStatus;
  onTogglePower?: () => void;
  onToggleSwitch?: () => void;
}

export const CircuitStatusBanner: React.FC<Props> = ({
  circuitStatus,
  onTogglePower,
  onToggleSwitch,
}) => {
  const isPowerOn = circuitStatus.isPowerOn;
  const isClosed = circuitStatus.isCircuitClosed;
  const isSwitchClosed = circuitStatus.isSwitchClosed;
  const current = circuitStatus.circuitCurrent * 1000; // in mA
  const voltage = circuitStatus.voltmeterReading;
  const isCurrentFlowing = isPowerOn && isClosed && current > 0.01;
  const powerMilliwatts = voltage * current;

  // Status diagnostics badge
  let statusBadgeColor = 'bg-slate-800/80 text-slate-400 border-slate-700/60';
  let statusText = 'DC SUPPLY OFF';
  let statusIcon = <Power className="w-3.5 h-3.5 text-slate-400" />;

  if (!isPowerOn) {
    statusBadgeColor = 'bg-slate-800/80 text-slate-400 border-slate-700/60';
    statusText = 'DC SUPPLY OFF';
    statusIcon = <Power className="w-3.5 h-3.5 text-slate-400" />;
  } else if (circuitStatus.hasShortCircuit) {
    statusBadgeColor = 'bg-red-950/80 text-red-300 border-red-700/80 animate-pulse';
    statusText = 'FAULT: SHORT CIRCUIT';
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
  } else if (!isSwitchClosed) {
    statusBadgeColor = 'bg-amber-950/80 text-amber-300 border-amber-700/80';
    statusText = 'KNIFE SWITCH OPEN';
    statusIcon = <ToggleLeft className="w-3.5 h-3.5 text-amber-400" />;
  } else if (!isClosed) {
    statusBadgeColor = 'bg-amber-950/80 text-amber-300 border-amber-700/80';
    statusText = 'SERIES LOOP INCOMPLETE';
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  } else {
    statusBadgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
    statusText = 'CIRCUIT ENERGIZED • ACTIVE';
    statusIcon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
  }

  return (
    <div className="fixed top-14 sm:top-15 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300">
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/40 text-xs">
        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold tracking-wider uppercase border text-[10px] shrink-0 ${statusBadgeColor}`}
        >
          {statusIcon}
          <span>{statusText}</span>
        </div>

        {/* Quick Readout */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-300 font-mono text-[11px] shrink-0">
          <button
            type="button"
            onClick={onTogglePower}
            className={`px-1.5 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer ${
              isPowerOn ? 'text-red-300 font-semibold' : 'text-slate-400'
            }`}
            title="Toggle DC Power"
          >
            PS: {isPowerOn ? `${circuitStatus.appliedVoltage.toFixed(1)}V` : 'OFF'}
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={onToggleSwitch}
            className={`px-1.5 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer ${
              isSwitchClosed ? 'text-amber-300 font-semibold' : 'text-slate-400'
            }`}
            title="Toggle Knife Switch"
          >
            SW: {isSwitchClosed ? 'CLOSED' : 'OPEN'}
          </button>
          <span className="text-slate-600">•</span>
          <span className={isCurrentFlowing ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
            I: {current.toFixed(1)} mA
          </span>
          <span className="text-slate-600">•</span>
          <span className={isCurrentFlowing ? 'text-cyan-400 font-semibold' : 'text-slate-400'}>
            V: {voltage.toFixed(2)} V
          </span>
        </div>

        {/* Live Power Indicator */}
        {isCurrentFlowing && (
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 font-mono text-[10px] font-semibold shrink-0">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span>{powerMilliwatts.toFixed(1)} mW</span>
          </div>
        )}
      </div>
    </div>
  );
};
