import React, { useState } from 'react';
import type { WireColor, WireConnection, TerminalId } from '../../types/circuit';
import { Cable, Trash2, Sparkles, Check, ChevronUp, ChevronDown, X } from 'lucide-react';

interface Props {
  activeColor: WireColor;
  onSelectColor: (color: WireColor) => void;
  selectedTerminal: TerminalId | null;
  wires: WireConnection[];
  onAutoWireCorrectCircuit: () => void;
  onClearWires: () => void;
  onRemoveWire?: (wireId: string) => void;
  onHoverWire?: (wireId: string | null) => void;
}

const WIRE_COLORS: { id: WireColor; name: string; hex: string; bgClass: string }[] = [
  { id: 'red', name: 'Positive (+)', hex: '#ef4444', bgClass: 'bg-red-500' },
  { id: 'black', name: 'Negative (-)', hex: '#18181b', bgClass: 'bg-zinc-800' },
  { id: 'yellow', name: 'Voltmeter (+)', hex: '#eab308', bgClass: 'bg-yellow-500' },
  { id: 'blue', name: 'Voltmeter (-)', hex: '#3b82f6', bgClass: 'bg-blue-500' },
  { id: 'green', name: 'Ground (GND)', hex: '#10b981', bgClass: 'bg-emerald-500' },
];

const TERMINAL_NAMES: Record<TerminalId, string> = {
  ps_pos: 'DC Supply (+)',
  ps_neg: 'DC Supply (-)',
  ps_gnd: 'DC GND',
  sw_in: 'Switch In (Hinge)',
  sw_out: 'Switch Out (Jaw)',
  ammeter_pos: 'Ammeter (+)',
  ammeter_neg: 'Ammeter (-)',
  resistor_t1: 'Resistor (T1)',
  resistor_t2: 'Resistor (T2)',
  voltmeter_pos: 'Voltmeter (+)',
  voltmeter_neg: 'Voltmeter (-)',
};

// Compact names for smaller mobile screens
const TERMINAL_SHORT_NAMES: Record<TerminalId, string> = {
  ps_pos: 'PS (+)',
  ps_neg: 'PS (-)',
  ps_gnd: 'GND',
  sw_in: 'SW In',
  sw_out: 'SW Out',
  ammeter_pos: 'Amm (+)',
  ammeter_neg: 'Amm (-)',
  resistor_t1: 'R (T1)',
  resistor_t2: 'R (T2)',
  voltmeter_pos: 'Volt (+)',
  voltmeter_neg: 'Volt (-)',
};

export const WireToolbar: React.FC<Props> = ({
  activeColor,
  onSelectColor,
  selectedTerminal,
  wires,
  onAutoWireCorrectCircuit,
  onClearWires,
  onRemoveWire,
  onHoverWire,
}) => {
  const [wireListOpen, setWireListOpen] = useState(false);

  return (
    <div className="fixed bottom-2 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 w-auto max-w-[calc(100vw-1rem)] sm:max-w-2xl lg:max-w-3xl px-1 sm:px-2 flex flex-col items-center gap-1.5 pointer-events-auto transition-all duration-200">
      {/* Individual Wire Inspector Popover */}
      {wireListOpen && wires.length > 0 && (
        <div className="w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl text-slate-200 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Cable className="w-4 h-4 text-cyan-400" />
              <span>Connected Wires ({wires.length})</span>
              <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">
                — Hover to highlight in 3D, click (✕) to remove
              </span>
            </div>
            <button
              type="button"
              onClick={onClearWires}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-[10px] font-medium transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Remove All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 sm:max-h-48 overflow-y-auto pr-1">
            {wires.map((w, idx) => {
              const colorDef = WIRE_COLORS.find((c) => c.id === w.color) || WIRE_COLORS[0];
              const fromName = TERMINAL_NAMES[w.fromTerminal] || w.fromTerminal;
              const toName = TERMINAL_NAMES[w.toTerminal] || w.toTerminal;

              return (
                <div
                  key={w.id}
                  onMouseEnter={() => onHoverWire?.(w.id)}
                  onMouseLeave={() => onHoverWire?.(null)}
                  className="flex items-center justify-between gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition group"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: colorDef.hex }}
                    />
                    <span className="font-mono text-[10px] sm:text-[11px] text-slate-300 truncate">
                      {idx + 1}. {fromName} <span className="text-cyan-400">➔</span> {toName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveWire?.(w.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer shrink-0"
                    title={`Remove wire: ${fromName} ➔ ${toName}`}
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bottom Toolbar Bar */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 sm:p-2 text-slate-200 flex items-center justify-between gap-1 sm:gap-2 text-xs font-sans w-full box-border overflow-hidden">
        {/* Wire Color Selector */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <Cable className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
          <span className="hidden xl:inline text-[11px] font-semibold text-slate-400 mr-0.5">Color:</span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {WIRE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectColor(c.id)}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${c.bgClass} flex items-center justify-center transition border-2 cursor-pointer shrink-0 ${
                  activeColor === c.id
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={c.name}
              >
                {activeColor === c.id && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Wiring Status Tip & Wire Count Dropdown Trigger */}
        <div className="min-w-0 flex-1 flex items-center justify-center px-1 sm:px-1.5">
          {selectedTerminal ? (
            <div className="min-w-0 max-w-full flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/80 border border-amber-600/70 text-amber-300 font-mono text-[10px] sm:text-[11px] font-bold animate-pulse truncate shadow-sm">
              <span className="hidden md:inline">Wiring: </span>
              <span className="text-white truncate hidden sm:inline">
                [{TERMINAL_NAMES[selectedTerminal] || selectedTerminal}]
              </span>
              <span className="text-white truncate sm:hidden">
                [{TERMINAL_SHORT_NAMES[selectedTerminal] || selectedTerminal}]
              </span>
              <span className="text-cyan-400 shrink-0">➔</span>
              <span className="hidden sm:inline shrink-0">Click 2nd</span>
              <span className="sm:hidden shrink-0">Pick 2nd</span>
            </div>
          ) : (
            <div className="min-w-0 flex items-center gap-1.5 justify-center">
              <span className="hidden lg:inline text-[11px] font-mono text-slate-400 truncate">
                Click 3D terminals to connect • Click wire to remove
              </span>
              {wires.length > 0 && (
                <button
                  type="button"
                  onClick={() => setWireListOpen(!wireListOpen)}
                  className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg border text-[10px] sm:text-[11px] font-medium transition cursor-pointer shrink-0 ${
                    wireListOpen
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="View and remove individual wires"
                >
                  <span>{wires.length} Wires</span>
                  {wireListOpen ? (
                    <ChevronDown className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <ChevronUp className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions: Auto-wire correct & Clear */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onAutoWireCorrectCircuit}
            className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold text-[11px] sm:text-xs shadow-md shadow-cyan-950/50 transition cursor-pointer"
            title="Automatically connect standard series ammeter and parallel voltmeter circuit"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Auto-Wire</span>
            <span className="hidden lg:inline"> Circuit</span>
            <span className="sm:hidden">Auto</span>
          </button>

          {wires.length > 0 && (
            <button
              type="button"
              onClick={onClearWires}
              className="shrink-0 p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="Remove all wires"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
