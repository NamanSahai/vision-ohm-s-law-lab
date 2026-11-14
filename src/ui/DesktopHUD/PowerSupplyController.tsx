import React, { useState } from 'react';
import type { CircuitStatus } from '../../types/circuit';
import {
  Power,
  Zap,
  Sliders,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Gauge,
} from 'lucide-react';
import { labAudio } from '../../audio/LabSoundSynthesizer';

interface Props {
  circuitStatus: CircuitStatus;
  onTogglePower: () => void;
  onToggleSwitch: () => void;
  onVoltageChange: (voltage: number) => void;
}

export const PowerSupplyController: React.FC<Props> = ({
  circuitStatus,
  onTogglePower,
  onToggleSwitch,
  onVoltageChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleVoltageAdjust = (val: number) => {
    const clamped = Math.max(0, Math.min(10, Math.round(val * 10) / 10));
    labAudio.playKnobTick();
    onVoltageChange(clamped);
  };

  const handleTogglePowerWithAudio = () => {
    labAudio.playPowerSwitch(!circuitStatus.isPowerOn);
    onTogglePower();
  };

  const handleToggleSwitchWithAudio = () => {
    if (circuitStatus.isSwitchClosed) {
      labAudio.playKnifeSwitchOpen();
    } else {
      labAudio.playKnifeSwitchClose();
    }
    onToggleSwitch();
  };

  const powerMilliwatts =
    circuitStatus.isPowerOn && circuitStatus.isCircuitClosed
      ? circuitStatus.voltmeterReading * circuitStatus.ammeterReading
      : 0;

  return (
    <div className="fixed top-20 right-4 z-30 max-w-xs w-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-200 space-y-3 font-sans transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wider text-white uppercase">
            Laboratory Controller
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              circuitStatus.isPowerOn && circuitStatus.isCircuitClosed
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {circuitStatus.isPowerOn && circuitStatus.isCircuitClosed ? 'ENERGIZED' : 'STANDBY'}
          </span>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={isCollapsed ? 'Expand Controller' : 'Minimize Controller'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Main Power Supply Switch & Knife Switch Toggles */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Power Supply ON/OFF */}
            <button
              type="button"
              onClick={handleTogglePowerWithAudio}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition shadow ${
                circuitStatus.isPowerOn
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{circuitStatus.isPowerOn ? 'Power ON' : 'Power OFF'}</span>
            </button>

            {/* SPST Knife Switch Toggle */}
            <button
              type="button"
              onClick={handleToggleSwitchWithAudio}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition shadow ${
                circuitStatus.isSwitchClosed
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
              }`}
            >
              {circuitStatus.isSwitchClosed ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              <span>{circuitStatus.isSwitchClosed ? 'Switch: CLOSED' : 'Switch: OPEN'}</span>
            </button>
          </div>

          {/* Voltage Dial & Slider */}
          <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Voltage Knob (V):
              </span>
              <span className="font-mono text-base font-extrabold text-cyan-300">
                {circuitStatus.appliedVoltage.toFixed(2)} V
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={circuitStatus.appliedVoltage}
              onChange={(e) => handleVoltageAdjust(parseFloat(e.target.value))}
              disabled={!circuitStatus.isPowerOn}
              className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
            />

            {/* Precision Micro Steppers */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleVoltageAdjust(circuitStatus.appliedVoltage - 1.0)}
                  disabled={!circuitStatus.isPowerOn || circuitStatus.appliedVoltage <= 0}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 border border-slate-700 disabled:opacity-40"
                  title="-1.0 Volt"
                >
                  -1.0V
                </button>
                <button
                  type="button"
                  onClick={() => handleVoltageAdjust(circuitStatus.appliedVoltage - 0.1)}
                  disabled={!circuitStatus.isPowerOn || circuitStatus.appliedVoltage <= 0}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 border border-slate-700 disabled:opacity-40"
                  title="-0.1 Volt"
                >
                  -0.1V
                </button>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleVoltageAdjust(circuitStatus.appliedVoltage + 0.1)}
                  disabled={!circuitStatus.isPowerOn || circuitStatus.appliedVoltage >= 10}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 border border-slate-700 disabled:opacity-40"
                  title="+0.1 Volt"
                >
                  +0.1V
                </button>
                <button
                  type="button"
                  onClick={() => handleVoltageAdjust(circuitStatus.appliedVoltage + 1.0)}
                  disabled={!circuitStatus.isPowerOn || circuitStatus.appliedVoltage >= 10}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 border border-slate-700 disabled:opacity-40"
                  title="+1.0 Volt"
                >
                  +1.0V
                </button>
              </div>
            </div>

            {/* Quick Voltage Jump Presets */}
            <div className="grid grid-cols-6 gap-1 pt-1">
              {[1, 2, 4, 6, 8, 10].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleVoltageAdjust(v)}
                  disabled={!circuitStatus.isPowerOn}
                  className={`py-1 rounded text-[11px] font-mono font-semibold transition ${
                    Math.abs(circuitStatus.appliedVoltage - v) < 0.05
                      ? 'bg-cyan-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
                  }`}
                >
                  {v}V
                </button>
              ))}
            </div>
          </div>

          {/* Live Digital Meter Displays & Power Readout */}
          <div className="grid grid-cols-2 gap-2 font-mono">
            {/* Voltmeter readout */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Voltmeter (V)</div>
              <div className="text-lg font-black text-cyan-400">
                {circuitStatus.voltmeterReading.toFixed(2)} <span className="text-xs text-slate-400">V</span>
              </div>
              <div className="text-[10px] text-slate-500 font-sans">Across Resistor R</div>
            </div>

            {/* Ammeter readout */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Ammeter (mA)</div>
              <div className="text-lg font-black text-emerald-400">
                {circuitStatus.ammeterReading.toFixed(1)} <span className="text-xs text-slate-400">mA</span>
              </div>
              <div className="text-[10px] text-slate-500 font-sans">Series Branch</div>
            </div>
          </div>

          {/* Live Power Dissipation & Status Banner */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 text-[11px] flex items-center gap-1 font-sans">
              <Gauge className="w-3.5 h-3.5 text-amber-400" /> Power Dissipation:
            </span>
            <span className="text-amber-300 font-bold">
              {powerMilliwatts.toFixed(1)} mW
            </span>
          </div>

          {/* Electrical Status Banner */}
          <div
            className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
              circuitStatus.hasShortCircuit
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : circuitStatus.isCorrectTopology
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            {circuitStatus.hasShortCircuit ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-tight text-[11px]">{circuitStatus.statusMessage}</div>
          </div>
        </>
      )}
    </div>
  );
};

