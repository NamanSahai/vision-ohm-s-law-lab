import React, { useState } from 'react';
import {
  X,
  Compass,
  Navigation,
  Cable,
  Trash2,
  Sliders,
  LineChart,
  Keyboard,
  HelpCircle,
  Zap,
  Eye,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type HelpTab = 'navigation' | 'wiring' | 'removing' | 'apparatus' | 'experiment' | 'shortcuts';

export const QuickHelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('navigation');

  if (!isOpen) return null;

  const tabs: { id: HelpTab; label: string; icon: React.ReactNode }[] = [
    { id: 'navigation', label: 'Navigation & Camera', icon: <Navigation className="w-4 h-4" /> },
    { id: 'wiring', label: 'Circuit Wiring', icon: <Cable className="w-4 h-4" /> },
    { id: 'removing', label: 'Removing Wires', icon: <Trash2 className="w-4 h-4" /> },
    { id: 'apparatus', label: 'Operating Apparatus', icon: <Sliders className="w-4 h-4" /> },
    { id: 'experiment', label: "Ohm's Law Procedure", icon: <LineChart className="w-4 h-4" /> },
    { id: 'shortcuts', label: 'Shortcuts Cheat Sheet', icon: <Keyboard className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[85vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  How to Use the Virtual Laboratory
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Quick Guide
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                BITS Pilani Virtual Electrical Sciences Lab • Complete Controls & Operating Manual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
              Press [H] or [Esc]
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-900/90 border-b border-slate-800 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed">
          {/* TAB 1: NAVIGATION & CAMERA */}
          {activeTab === 'navigation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" /> Walking & Moving Around the Lab
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <div className="font-semibold text-white text-xs mb-1">Keyboard Walking (WASD)</div>
                    <p className="text-xs text-slate-300">
                      Use <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-[11px] text-amber-300">W</kbd>{' '}
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-[11px] text-amber-300">A</kbd>{' '}
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-[11px] text-amber-300">S</kbd>{' '}
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-[11px] text-amber-300">D</kbd> or arrow keys to walk forward, back, and strafe left/right in the direction you are looking. Hold{' '}
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-[11px] text-amber-300">Shift</kbd> for faster walking speed.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <div className="font-semibold text-white text-xs mb-1">Mouse Movement (Look Around)</div>
                    <p className="text-xs text-slate-300">
                      Move your mouse to look here and there! Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-[11px] text-amber-300">F</kbd> for <strong>First-Person Free Look</strong> mode, or drag with the <strong>Right Mouse Button</strong> / <strong>Left Mouse Button</strong> to smoothly turn your gaze.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <div className="font-semibold text-white text-xs mb-1">Left Mouse Button (Click to Interact)</div>
                    <p className="text-xs text-slate-300">
                      <strong>Left-Click</strong> on 3D terminals to connect/disconnect wires. Click the knife switch to open/close it. Click the power rocker to toggle DC power. Click a wire to remove it, or drag apparatus to reposition them.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <div className="font-semibold text-white text-xs mb-1">Scroll Wheel (Optical Zoom)</div>
                    <p className="text-xs text-slate-300">
                      Use the <strong>Mouse Scroll Wheel</strong> to zoom in close to read small meter digits and resistor color bands, or scroll out for a wide laboratory room panorama.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" /> Camera Preset Quick Buttons (Left Bar)
                </h3>
                <p className="text-xs text-slate-300 mt-2">
                  Use the left sidebar buttons or press number keys <kbd className="px-1 bg-slate-800 rounded border border-slate-600 font-mono text-[11px]">1</kbd> to{' '}
                  <kbd className="px-1 bg-slate-800 rounded border border-slate-600 font-mono text-[11px]">5</kbd> for instant cinematic transitions:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                    [1] Overview
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                    [2] Circuit Closeup
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                    [3] Power Supply
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                    [4] Multimeters
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                    [5] Blackboard
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CIRCUIT WIRING */}
          {activeTab === 'wiring' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Cable className="w-4 h-4 text-cyan-400" /> How to Connect Leads & Wires
                </h3>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40">
                      1
                    </span>
                    <p>
                      <strong>Select Starting Terminal:</strong> Hover your mouse over any banana binding post terminal on the apparatus (Power Supply, Switch, Resistor, Ammeter, or Voltmeter). Click the terminal; a glowing golden halo will pulse around it.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40">
                      2
                    </span>
                    <p>
                      <strong>Select Destination Terminal:</strong> Click the target terminal on the other component. A realistic curved lead will immediately snap into place with heavy-duty brass banana plugs and molded strain relief boots.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40">
                      3
                    </span>
                    <p>
                      <strong>Standard Color Coding:</strong> Use the bottom wire toolbar to pick lead colors:
                      <span className="inline-flex items-center gap-1 ml-1 text-red-400 font-semibold">• Red (+ Series)</span>,
                      <span className="inline-flex items-center gap-1 ml-1 text-slate-300 font-semibold">• Black (- Ground Return)</span>,
                      <span className="inline-flex items-center gap-1 ml-1 text-amber-400 font-semibold">• Yellow (Voltmeter +)</span>,
                      <span className="inline-flex items-center gap-1 ml-1 text-blue-400 font-semibold">• Blue (Voltmeter -)</span>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40">
                      4
                    </span>
                    <p>
                      <strong>Intelligent Non-Overlapping Routing:</strong> Wires calculate 3D Catmull-Rom splines with high vertical elevation arches for parallel voltmeter leads and a rear sweep for return leads, preventing tangled or overlapping wires.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
                  <Zap className="w-4 h-4" /> BITS Pilani Reference Circuit Loop:
                </div>
                <div className="text-xs text-amber-200/90 font-mono bg-slate-950/80 p-2.5 rounded-lg border border-amber-900/50 space-y-1">
                  <div>1. Power Supply (+) &rarr; SPST Switch (In)</div>
                  <div>2. SPST Switch (Out) &rarr; Ammeter (+)</div>
                  <div>3. Ammeter (-) &rarr; Resistor Terminal 1</div>
                  <div>4. Resistor Terminal 2 &rarr; Power Supply (-) [Closes Series Loop]</div>
                  <div>5. Voltmeter (+) &rarr; Resistor Terminal 1 [Parallel Voltage Tap]</div>
                  <div>6. Voltmeter (-) &rarr; Resistor Terminal 2 [Parallel Voltage Tap]</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REMOVING WIRES */}
          {activeTab === 'removing' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-cyan-400" /> Three Ways to Disconnect or Remove Wires
                </h3>
                <p className="text-xs text-slate-300">
                  You can easily delete any wire mistake or rearrange connections using any of these simple methods:
                </p>

                <div className="space-y-3 mt-2">
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50 flex items-start gap-3">
                    <span className="px-2 py-1 bg-cyan-900/60 text-cyan-300 font-bold text-xs rounded border border-cyan-700/50">
                      Method 1
                    </span>
                    <div className="text-xs">
                      <div className="font-bold text-white mb-0.5">Direct 3D Click on Wire</div>
                      <p className="text-slate-300">
                        Hover your mouse over any wire in the 3D scene. The wire will glow in bright <strong>amber highlight</strong>. Simply <strong>left-click directly on the wire</strong> to remove it instantly.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50 flex items-start gap-3">
                    <span className="px-2 py-1 bg-indigo-900/60 text-indigo-300 font-bold text-xs rounded border border-indigo-700/50">
                      Method 2
                    </span>
                    <div className="text-xs">
                      <div className="font-bold text-white mb-0.5">Right-Click Any Terminal or Wire</div>
                      <p className="text-slate-300">
                        <strong>Right-click</strong> on any terminal socket to immediately disconnect all wires plugged into that post, or right-click any wire directly to delete it.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50 flex items-start gap-3">
                    <span className="px-2 py-1 bg-amber-900/60 text-amber-300 font-bold text-xs rounded border border-amber-700/50">
                      Method 3
                    </span>
                    <div className="text-xs">
                      <div className="font-bold text-white mb-0.5">Connected Wires Inspector Drawer</div>
                      <p className="text-slate-300">
                        Click the bottom toolbar button <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-mono">[N Wires ▾]</code> to expand the active wire drawer. Hover over any connection to preview it in 3D, and click the red <span className="text-red-400 font-bold">(X)</span> button to delete it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                💡 <em>Tip: You can also click the red <strong>"Clear All Wires"</strong> button on the bottom toolbar to reset the entire workbench wiring.</em>
              </div>
            </div>
          )}

          {/* TAB 4: OPERATING APPARATUS */}
          {activeTab === 'apparatus' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" /> DC Power Supply
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Regulated 0–10V DC laboratory unit. Click the <strong>illuminated Red Rocker Switch</strong> in 3D (or HUD button / Spacebar) to turn power ON. Turn the <strong>Coarse Voltage Knob</strong> or use the right HUD slider to set test voltages.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> SPST Knife Switch
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Classic copper blade switch on porcelain base. <strong>Click the blade in 3D</strong> (or press <kbd className="px-1 bg-slate-800 rounded font-mono text-[10px]">K</kbd>) to close the circuit. It features a realistic spring snap into the copper contact jaws. Current will not flow when OPEN!
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" /> 100Ω Resistor Specimen
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Precision wire-wound specimen with standard color bands (Brown-Black-Brown-Gold = 100Ω ±5%). It can be picked up and repositioned on the workbench by dragging.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-yellow-400" /> Digital Multimeters
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Fluke-style digital instruments with authentic dual-slope ADC settling digits. The <strong>Ammeter (mA)</strong> measures series circuit current, while the <strong>Voltmeter (V)</strong> measures parallel voltage across the resistor.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="font-bold text-white text-xs mb-1">Repositioning Apparatus on Workbench</div>
                <p className="text-xs text-slate-300">
                  Left-click and drag any apparatus base (Power Supply, Switch, Resistor, Meters) to move it across the teak workbench. Mutual obstacle colliders prevent apparatus from clipping into one another or falling off the table!
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: OHM'S LAW EXPERIMENTAL PROCEDURE */}
          {activeTab === 'experiment' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-cyan-400" /> Step-by-Step Laboratory Procedure
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <span className="font-bold text-cyan-400">Step 1:</span>
                    <span>Verify that the DC Power Supply is switched OFF and the Knife Switch is OPEN before making any connections.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <span className="font-bold text-cyan-400">Step 2:</span>
                    <span>Wire the series loop: Power Supply (+) &rarr; Knife Switch &rarr; Ammeter (+) &rarr; Resistor &rarr; Power Supply (-).</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <span className="font-bold text-cyan-400">Step 3:</span>
                    <span>Connect the Voltmeter in parallel directly across the two terminals of the 100Ω resistor specimen.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <span className="font-bold text-cyan-400">Step 4:</span>
                    <span>Turn Power ON and close the Knife Switch. Set the voltage to <strong>1.0 V</strong>. Observe current I ≈ 10 mA.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <span className="font-bold text-cyan-400">Step 5:</span>
                    <span>In the bottom-right Observation Drawer, click <strong>"Log Reading"</strong>. Increase voltage in 1.0 V or 2.0 V steps up to 10.0 V, recording a data point at each step.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <span className="font-bold text-cyan-400">Step 6:</span>
                    <span>Open the <strong>"Observation Table & Graph"</strong> drawer to inspect your V-I characteristic plot. Verify that V / I = R ≈ 100 Ω, confirming Ohm's Law!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SHORTCUTS CHEAT SHEET */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-3">
                  <Keyboard className="w-4 h-4 text-cyan-400" /> Keyboard Shortcuts Reference
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Walk Forward / Back / Left / Right</span>
                    <div className="flex gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">W</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">A</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">S</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">D</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Sprint / Fast Walk</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">Shift + WASD</kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Camera Preset Views</span>
                    <div className="flex gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-cyan-300">1</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-cyan-300">2</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-cyan-300">3</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-cyan-300">4</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-cyan-300">5</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Toggle Power Supply ON/OFF</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-emerald-300">Space</kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Toggle Knife Switch OPEN/CLOSE</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-yellow-300">K</kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Open / Close How to Use Guide</span>
                    <div className="flex gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-cyan-300">H</kbd>
                      <span className="text-slate-500">or</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-cyan-300">?</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Toggle First-Person Free Look</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-emerald-300">F</kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Close Open Modal / Unlock Cursor</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-slate-300">Esc</kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <span className="text-slate-300">Remove Wire or Disconnect</span>
                    <span className="text-[11px] font-mono text-cyan-400">Right-Click in 3D</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Interactive Laboratory Engine Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition"
          >
            Got It • Return to Lab
          </button>
        </div>
      </div>
    </div>
  );
};
