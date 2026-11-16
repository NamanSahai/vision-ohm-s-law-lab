import React from 'react';
import type { CircuitStatus } from '../../types/circuit';
import {
  Zap,
  AlertTriangle,
  Power,
  ToggleLeft,
  ToggleRight,
  Activity,
  ArrowRight,
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
  let statusBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
  let statusText = 'CIRCUIT IDLE';
  let statusIcon = <Power className="w-3.5 h-3.5" />;

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
    statusText = 'OHM\'S LAW VERIFIED • ACTIVE';
    statusIcon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
  }

  return (
    <div className="fixed top-14 sm:top-16 lg:top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300 w-auto max-w-[calc(100vw-1rem)]">
      <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/50 text-xs overflow-hidden">
        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl font-bold tracking-wider uppercase border text-[9px] sm:text-[10px] shrink-0 ${statusBadgeColor}`}
        >
          {statusIcon}
          <span>{statusText}</span>
        </div>

        {/* Circuit Loop Breadcrumb Pipeline (Full on XL, Compact on MD, Hidden on Mobile) */}
        <div className="hidden xl:flex items-center gap-1.5 text-slate-400 font-mono text-[11px] shrink-0">
          {/* Node 1: DC Power Supply */}
          <button
            onClick={onTogglePower}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition cursor-pointer ${
              isPowerOn
                ? 'bg-red-950/40 border-red-700/50 text-red-300 font-semibold'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200'
            }`}
            title="Click to toggle Power"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPowerOn ? 'bg-red-400 animate-ping' : 'bg-slate-600'}`} />
            <span>PS ({isPowerOn ? `${circuitStatus.appliedVoltage.toFixed(1)}V` : 'OFF'})</span>
          </button>

          <ArrowRight className={`w-3 h-3 ${isCurrentFlowing ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />

          {/* Node 2: SPST Switch */}
          <button
            onClick={onToggleSwitch}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition cursor-pointer ${
              isSwitchClosed
                ? 'bg-amber-950/40 border-amber-700/50 text-amber-300 font-semibold'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200'
            }`}
            title="Click to toggle Switch"
          >
            {isSwitchClosed ? <ToggleRight className="w-3 h-3 text-amber-400" /> : <ToggleLeft className="w-3 h-3 text-slate-500" />}
            <span>Switch ({isSwitchClosed ? 'CLOSED' : 'OPEN'})</span>
          </button>

          <ArrowRight className={`w-3 h-3 ${isCurrentFlowing ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />

          {/* Node 3: Ammeter */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
              isCurrentFlowing
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 font-semibold'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Ammeter ({current.toFixed(1)} mA)</span>
          </div>

          <ArrowRight className={`w-3 h-3 ${isCurrentFlowing ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />

          {/* Node 4: Resistor */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-cyan-950/40 border-cyan-700/50 text-cyan-300 font-semibold">
            <span>Resistor (100Ω)</span>
            <span className="text-[10px] text-cyan-400/80">[{voltage.toFixed(2)}V]</span>
          </div>

          <ArrowRight className={`w-3 h-3 ${isCurrentFlowing ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />

          {/* Node 5: Return to Ground */}
          <div className="px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-400 text-[10px]">
            GND (-)
          </div>
        </div>

        {/* Compact Summary for Medium Screens */}
        <div className="hidden sm:flex xl:hidden items-center gap-1.5 text-slate-400 font-mono text-[10px]">
          <span className={isPowerOn ? 'text-red-300' : 'text-slate-500'}>
            PS: {isPowerOn ? `${circuitStatus.appliedVoltage.toFixed(1)}V` : 'OFF'}
          </span>
          <span>•</span>
          <span className={isSwitchClosed ? 'text-amber-300' : 'text-slate-500'}>
            SW: {isSwitchClosed ? 'CLOSED' : 'OPEN'}
          </span>
          <span>•</span>
          <span className={isCurrentFlowing ? 'text-emerald-300' : 'text-slate-500'}>
            I: {current.toFixed(1)}mA
          </span>
        </div>

        {/* Live Power Readout (P = V * I) */}
        {isCurrentFlowing && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 font-mono text-[10px] sm:text-[11px] font-semibold shrink-0">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">P = </span>
            <span>{powerMilliwatts.toFixed(1)} mW</span>
          </div>
        )}
      </div>
    </div>
  );
};
