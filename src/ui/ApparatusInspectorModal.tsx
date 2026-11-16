import React from 'react';
import { X, ShieldAlert, Cpu, Gauge, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'equipment' | 'safety';
}

export const ApparatusInspectorModal: React.FC<Props> = ({ isOpen, onClose, initialTab = 'equipment' }) => {
  const [tab, setTab] = React.useState<'equipment' | 'safety'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-800/80 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setTab('equipment')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                tab === 'equipment' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Equipment Datasheet</span>
              <span className="sm:hidden">Equipment</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('safety')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                tab === 'safety' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Safety Instructions</span>
              <span className="sm:hidden">Safety</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm leading-relaxed">
          {tab === 'equipment' && (
            <div className="space-y-4">
              {/* Equipment 1: DC Power Supply */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" /> DC Regulated Power Supply
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">0-30V • 2A</span>
                </div>
                <p className="text-xs text-slate-300">
                  Provides a continuously adjustable, stabilized DC voltage. Features rotary voltage knob controls (Coarse &amp; Fine) and an illuminated power rocker switch.
                </p>
                <div className="text-xs font-mono bg-slate-950/70 p-2.5 rounded border border-slate-800 space-y-1">
                  <div><strong>Terminals:</strong> (+) Positive (Red), (-) Negative (Black), GND Earth (Green)</div>
                  <div><strong>Operating Range:</strong> 0.00 V to 10.00 V (Experiment limit)</div>
                </div>
              </div>

              {/* Equipment 2: Resistor Specimen */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" /> Carbon Film Resistor Specimen
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">100 Ω ± 5% • 1.0W</span>
                </div>
                <p className="text-xs text-slate-300">
                  Fixed axial metal film/carbon resistor mounted on a heavy acrylic baseboard with two brass screw binding posts (T1 and T2).
                </p>
                <div className="text-xs font-mono bg-slate-950/70 p-2.5 rounded border border-slate-800 space-y-1">
                  <div><strong>Color Bands:</strong> Brown (1), Black (0), Brown (×10), Gold (±5%) = 100 Ω</div>
                  <div><strong>Max Dissipation:</strong> P = I²R = 2.0 Watts</div>
                </div>
              </div>

              {/* Equipment 3: Digital Voltmeter */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" /> Digital Voltmeter (V)
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">Parallel Instrument</span>
                </div>
                <p className="text-xs text-slate-300">
                  High-input-impedance digital voltmeter (~10 MΩ) that measures electric potential difference across the resistor without drawing noticeable current from the branch.
                </p>
                <div className="text-xs font-mono bg-slate-950/70 p-2.5 rounded border border-slate-800 space-y-1">
                  <div><strong>Connection Rule:</strong> Must strictly be connected in PARALLEL across the resistor.</div>
                </div>
              </div>

              {/* Equipment 4: Digital Ammeter */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-400" /> Digital Ammeter (mA)
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">Series Instrument</span>
                </div>
                <p className="text-xs text-slate-300">
                  Low-internal-impedance digital ammeter (~0.05 Ω) that measures the current flowing through the circuit loop.
                </p>
                <div className="text-xs font-mono bg-slate-950/70 p-2.5 rounded border border-slate-800 space-y-1">
                  <div><strong>Connection Rule:</strong> Must strictly be connected in SERIES with the circuit loop.</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'safety' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200">
                <h4 className="font-bold text-sm text-rose-300 flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4" /> Laboratory Safety Precautions
                </h4>
                <p>
                  Follow these essential engineering laboratory safety protocols to ensure accurate experimental results and avoid component damage:
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <strong className="text-cyan-300">1. Why is an Ammeter connected in series?</strong>
                  <p className="text-slate-300 mt-1">
                    An ammeter measures the rate of charge flow through a loop. It has near-zero internal resistance. Connecting an ammeter in parallel across a voltage source causes a destructive <strong>short circuit</strong> with excessive current!
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <strong className="text-cyan-300">2. Why is a Voltmeter connected in parallel?</strong>
                  <p className="text-slate-300 mt-1">
                    A voltmeter measures the potential difference between two points. It has an extremely high internal resistance (~10 MΩ) so it does not alter the current in the circuit branch being measured. Connecting it in series turns the circuit into an effective open circuit.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <strong className="text-cyan-300">3. Constant Temperature Assumption</strong>
                  <p className="text-slate-300 mt-1">
                    Ohm&apos;s Law ($V = I \cdot R$) is strictly valid only when physical conditions, particularly temperature, remain constant. Excessive current causes heating ($P = I^2 R$), which increases conductor resistance and deviates the graph from a straight line.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <strong className="text-cyan-300">4. Voltage Adjustment Procedure</strong>
                  <p className="text-slate-300 mt-1">
                    Always start with the DC power supply knob at 0.0V. Turn on the main switch, then increment voltage in smooth steps (1V, 2V, 4V, 6V, 8V, 10V) while logging observations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-800/50 flex justify-between items-center text-xs text-slate-400">
          <span>BITS Pilani • Basic Electrical Sciences Lab (EEE F111)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
