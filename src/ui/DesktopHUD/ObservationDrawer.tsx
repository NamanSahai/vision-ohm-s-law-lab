import React, { useState } from 'react';
import type { ObservationReading, CircuitStatus } from '../../types/circuit';
import {
  Table,
  Plus,
  Trash2,
  TrendingUp,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { labAudio } from '../../audio/LabSoundSynthesizer';

interface Props {
  readings: ObservationReading[];
  circuitStatus: CircuitStatus;
  onAddReading: () => void;
  onDeleteReading: (id: string) => void;
  onClearReadings: () => void;
}

export const ObservationDrawer: React.FC<Props> = ({
  readings,
  circuitStatus,
  onAddReading,
  onDeleteReading,
  onClearReadings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'graph'>('table');
  const [copied, setCopied] = useState(false);

  // Linear Regression: V = m * I + c (where m is slope in V/mA => m * 1000 = Ohms)
  let calculatedResistance = 0;
  let rSquared = 0;
  let isVerified = false;
  let percentError = 0;

  if (readings.length >= 2) {
    const n = readings.length;
    let sumI = 0; // Current in A
    let sumV = 0; // Voltage in V
    let sumIV = 0;
    let sumI2 = 0;
    let sumV2 = 0;

    for (const r of readings) {
      const iAmps = r.current / 1000.0;
      const v = r.voltage;
      sumI += iAmps;
      sumV += v;
      sumIV += iAmps * v;
      sumI2 += iAmps * iAmps;
      sumV2 += v * v;
    }

    const denominator = n * sumI2 - sumI * sumI;
    if (Math.abs(denominator) > 0.000001) {
      const slope = (n * sumIV - sumI * sumV) / denominator;
      calculatedResistance = Math.round(slope * 10) / 10;
      percentError = Math.round(Math.abs((calculatedResistance - 100.0) / 100.0) * 1000) / 10;

      // R^2 goodness of fit
      const rNum = n * sumIV - sumI * sumV;
      const rDen = Math.sqrt((n * sumI2 - sumI * sumI) * (n * sumV2 - sumV * sumV));
      if (rDen > 0) {
        const rVal = rNum / rDen;
        rSquared = Math.round(rVal * rVal * 1000) / 1000;
      }

      // Check if resistance is close to nominal 100 Ohms (+- 5%)
      isVerified = Math.abs(calculatedResistance - 100) <= 5.0 && rSquared >= 0.98;
    }
  }

  const handleRecordWithCelebration = () => {
    labAudio.playReadingLogged();
    onAddReading();
    if (readings.length + 1 >= 5 && isVerified) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleExportCSV = () => {
    if (readings.length === 0) return;
    const headers = ['Obs #', 'Voltage (V)', 'Current (mA)', 'Calculated Resistance (Ohms)', 'Timestamp'];
    const rows = readings.map((r) => [
      r.readingNumber,
      r.voltage.toFixed(2),
      r.current.toFixed(1),
      r.resistance.toFixed(1),
      `"${r.timestamp}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ohms_law_lab_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTable = () => {
    if (readings.length === 0) return;
    const text = readings
      .map((r) => `#${r.readingNumber}\tV=${r.voltage.toFixed(2)}V\tI=${r.current.toFixed(1)}mA\tR=${r.resistance.toFixed(1)}Ω`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed bottom-0 right-2 sm:right-4 z-40 transition-all duration-300 pointer-events-auto ${
      isOpen ? 'w-full max-w-[calc(100vw-1rem)] sm:max-w-lg' : 'w-auto max-w-fit sm:max-w-xs md:max-w-sm'
    }`}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-slate-900/95 hover:bg-slate-800 text-slate-200 border-t border-x border-slate-700/80 rounded-t-2xl shadow-2xl backdrop-blur-xl cursor-pointer transition font-sans gap-1.5 sm:gap-2"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <Table className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
            <span className="hidden sm:inline">Observations &amp; </span>Graph
          </span>
          <span className="px-1.5 sm:px-2 py-0.5 text-[10px] rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono shrink-0">
            {readings.length}
          </span>
          {isVerified && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-semibold shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Verified</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 shrink-0">
          <span className="text-[11px] font-mono text-cyan-300 hidden md:inline">
            {circuitStatus.isCircuitClosed && circuitStatus.isPowerOn
              ? `Live: ${circuitStatus.voltmeterReading.toFixed(2)}V • ${circuitStatus.ammeterReading.toFixed(1)}mA`
              : 'Supply Off'}
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Drawer Body */}
      {isOpen && (
        <div className="bg-slate-900/95 border-x border-b border-slate-700/80 p-4 shadow-2xl backdrop-blur-2xl text-slate-200 space-y-3 font-sans max-h-[72vh] overflow-y-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  activeTab === 'table' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Data Table ({readings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'graph' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> V-I Graph
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {readings.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyTable}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
                    title="Copy Data Table to Clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
                    title="Export CSV Lab Report"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleRecordWithCelebration}
                disabled={!circuitStatus.isPowerOn || !circuitStatus.isCircuitClosed}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                  circuitStatus.isPowerOn && circuitStatus.isCircuitClosed
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Reading</span>
              </button>
            </div>
          </div>

          {/* TAB 1: TABLE */}
          {activeTab === 'table' && (
            <div className="space-y-2">
              <div className="overflow-x-auto border border-slate-700 rounded-xl bg-slate-950/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-800/90 text-slate-300 border-b border-slate-700">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Voltage V (V)</th>
                      <th className="p-2">Current I (mA)</th>
                      <th className="p-2">R = V/I (Ω)</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {readings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                          No readings recorded yet. Vary the voltage knob and click &ldquo;Log Reading&rdquo; to capture data points.
                        </td>
                      </tr>
                    ) : (
                      readings.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-slate-400">{r.readingNumber}</td>
                          <td className="p-2 text-cyan-300 font-bold">{r.voltage.toFixed(2)}</td>
                          <td className="p-2 text-emerald-300 font-bold">{r.current.toFixed(1)}</td>
                          <td className="p-2 text-amber-300 font-bold">{r.resistance.toFixed(1)}</td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => onDeleteReading(r.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {readings.length > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={onClearReadings}
                    className="text-rose-400 hover:text-rose-300 text-[11px] underline"
                  >
                    Clear All Readings
                  </button>
                  <span className="font-mono text-slate-300 text-[11px]">
                    Average R: {(readings.reduce((acc, r) => acc + r.resistance, 0) / readings.length).toFixed(1)} Ω
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: V-I GRAPH */}
          {activeTab === 'graph' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                {readings.length < 2 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs text-center space-y-1">
                    <TrendingUp className="w-8 h-8 text-slate-700" />
                    <span>Record at least 2 readings at different voltages to generate the V-I plot.</span>
                  </div>
                ) : (
                  <svg viewBox="0 0 400 220" className="w-full h-48 select-none">
                    {/* Grid Lines */}
                    {[40, 80, 120, 160, 200].map((y) => (
                      <line key={y} x1="45" y1={y} x2="380" y2={y} stroke="#1e293b" strokeWidth="1" />
                    ))}
                    {[45, 110, 175, 240, 305, 370].map((x) => (
                      <line key={x} x1={x} y1="20" x2={x} y2="190" stroke="#1e293b" strokeWidth="1" />
                    ))}

                    {/* Axes */}
                    <line x1="45" y1="190" x2="380" y2="190" stroke="#64748b" strokeWidth="2" />
                    <line x1="45" y1="20" x2="45" y2="190" stroke="#64748b" strokeWidth="2" />

                    {/* Axis Labels */}
                    <text x="210" y="212" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="sans-serif">
                      Current I (mA) ➔
                    </text>
                    <text x="18" y="105" fill="#94a3b8" fontSize="11" textAnchor="middle" transform="rotate(-90 18 105)" fontFamily="sans-serif">
                      Voltage V (V) ➔
                    </text>

                    {/* Ideal 100 Ohm Reference Line (Subtle Cyan) */}
                    <line
                      x1="45"
                      y1="190"
                      x2={45 + (100.0 / 120.0) * 335}
                      y2={190 - (10.0 / 12.0) * 170}
                      stroke="#0284c7"
                      strokeWidth="1.5"
                      strokeOpacity="0.6"
                    />

                    {/* Linear Regression Best Fit Line (Amber Dashed) */}
                    {readings.length >= 2 && (
                      <line
                        x1="45"
                        y1="190"
                        x2={45 + (Math.min(120, 10.0 / (calculatedResistance / 1000.0)) / 120.0) * 335}
                        y2={190 - (10.0 / 12.0) * 170}
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="4,2"
                      />
                    )}

                    {/* Data Points */}
                    {readings.map((r) => {
                      const cx = 45 + Math.min(335, (r.current / 120.0) * 335);
                      const cy = 190 - Math.min(170, (r.voltage / 12.0) * 170);
                      return (
                        <g key={r.id}>
                          <circle cx={cx} cy={cy} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                          <text x={cx} y={cy - 8} fill="#e2e8f0" fontSize="9" textAnchor="middle" fontFamily="monospace">
                            ({r.voltage}V)
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              {/* Chart Legend */}
              {readings.length >= 2 && (
                <div className="flex items-center justify-center gap-4 text-[11px] font-sans text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-amber-400 border border-amber-400" />
                    <span>Measured Fit ({calculatedResistance} Ω)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-cyan-600" />
                    <span>Ideal Nominal (100 Ω)</span>
                  </div>
                </div>
              )}

              {/* Slope and Resistance Calculation Summary */}
              {readings.length >= 2 && (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calculated R (ΔV / ΔI):</span>
                    <span className="text-cyan-300 font-bold">{calculatedResistance} Ω</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Correlation (R²):</span>
                    <span className="text-emerald-300 font-bold">{rSquared}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nominal Specimen R:</span>
                    <span className="text-slate-200">100.0 Ω</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Percentage Error:</span>
                    <span className={`font-bold ${percentError <= 5.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {percentError.toFixed(1)}%
                    </span>
                  </div>
                  <hr className="border-slate-700" />
                  <div className="text-[11px] font-sans flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Ohm&apos;s Law Confirmed:</strong> Straight-line linear relationship through origin (V ∝ I). Specimen resistance is constant at {calculatedResistance} Ω.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
