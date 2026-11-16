import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, HelpCircle, CheckCircle, GraduationCap, ChevronUp, ChevronDown } from 'lucide-react';

export interface TutorialStep {
  id: number;
  title: string;
  instruction: string;
  hint: string;
  targetFocus?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: '1. Objective & Ohm\'s Law Theory',
    instruction: 'Welcome to the BITS Pilani Electrical Engineering Laboratory. The objective is to verify Ohm\'s Law: V = I × R, confirming that current is directly proportional to applied voltage across a conductor at constant temperature.',
    hint: 'Review the green blackboard on the back wall for complete mathematical definitions.',
  },
  {
    id: 2,
    title: '2. Identify Equipment & Terminals',
    instruction: 'Locate the 4 primary apparatuses on the workbench: the DC Regulated Power Supply, the 100Ω Resistor Specimen, the Digital Ammeter (mA), and the Digital Voltmeter (V).',
    hint: 'Notice the terminal binding posts: Red (+ Positive), Black (- Ground/Return).',
  },
  {
    id: 3,
    title: '3. Construct the Series Circuit Loop',
    instruction: 'Connect the DC Supply (+) terminal to the Ammeter (+) terminal. Then connect Ammeter (-) to Resistor Terminal T1. Finally, connect Resistor Terminal T2 back to DC Supply (-) Negative.',
    hint: 'Ammeters have very low internal resistance (~0.05Ω) and MUST always be connected in SERIES.',
  },
  {
    id: 4,
    title: '4. Connect Voltmeter in Parallel',
    instruction: 'Connect the Voltmeter (+) terminal to Resistor T1, and the Voltmeter (-) terminal to Resistor T2. The voltmeter now measures potential difference directly across the specimen.',
    hint: 'Voltmeters have high internal resistance (~10MΩ) and MUST be connected in PARALLEL.',
  },
  {
    id: 5,
    title: '5. Energize the Power Supply',
    instruction: 'Close the SPST Knife Switch, then click "Power ON" on the DC Power Supply controller to energize the circuit.',
    hint: 'Always ensure your initial voltage is set to a low value before turning on power.',
  },
  {
    id: 6,
    title: '6. Adjust Voltage & Observe Meters',
    instruction: 'Gradually increase voltage using the slider or step buttons (e.g. 2V, 4V, 6V, 8V, 10V). Observe how current increases in direct proportion to voltage!',
    hint: 'At 5.0V across a 100Ω resistor, expected current is 50.0 mA (I = 5 / 100 = 0.05A).',
  },
  {
    id: 7,
    title: '7. Record 5+ Observations',
    instruction: 'For each voltage step, open the "Observation Table" drawer and click "Record Reading" to log the voltage and current values.',
    hint: 'Take at least 5 different voltage readings between 1V and 10V.',
  },
  {
    id: 8,
    title: '8. Analyze V-I Graph & Calculate Resistance',
    instruction: 'Switch to the "V-I Graph" tab in the Observation Drawer. Observe the linear regression line plotting Voltage (Y) versus Current (X).',
    hint: 'The slope of the V-I curve (ΔV / ΔI) directly equals the experimental resistance R in Ohms.',
  },
  {
    id: 9,
    title: '9. Verification & Conclusion',
    instruction: 'Verify that the calculated slope equals ~100Ω and that the points form a straight line through the origin, proving V ∝ I.',
    hint: 'Congratulations! You have verified Ohm\'s Law in the virtual engineering laboratory.',
  },
];

interface Props {
  currentStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSelectStep: (index: number) => void;
}

export const TutorialStepCard: React.FC<Props> = ({
  currentStepIndex,
  onNextStep,
  onPrevStep,
}) => {
  const [showHint, setShowHint] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const step = TUTORIAL_STEPS[currentStepIndex];
  const progressPercent = ((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100;

  if (isCollapsed) {
    return (
      <div className="pointer-events-auto max-w-full transition-all duration-300">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/50 text-white shadow-xl backdrop-blur-xl text-xs font-semibold hover:bg-slate-900 hover:border-cyan-400 transition cursor-pointer group"
          title="Expand Tutorial Guide"
        >
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span className="truncate max-w-[180px] text-cyan-300 font-mono text-[11px]">
            Step {step.id}: {step.title.split('. ')[1] || step.title}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto max-w-full w-full max-h-[calc(100vh-22rem)] flex flex-col bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl p-3 sm:p-3.5 text-slate-200 space-y-2 sm:space-y-2.5 font-sans transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <div className="w-5 h-5 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider truncate">
            Tutorial • Step {step.id} of {TUTORIAL_STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-amber-400 hover:text-amber-300 text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Minimize to floating pill"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden shrink-0">
        <div
          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Title & Instruction */}
      <div className="space-y-1 flex-1 min-h-0 max-h-24 sm:max-h-32 overflow-y-auto pr-1">
        <h3 className="font-bold text-white text-xs">{step.title}</h3>
        <p className="text-[11px] text-slate-300 leading-relaxed">{step.instruction}</p>
      </div>

      {/* Expandable Hint Box */}
      {showHint && (
        <div className="p-2 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-200 text-[11px] leading-relaxed animate-in fade-in duration-150 shrink-0 max-h-16 overflow-y-auto">
          <strong>Tip:</strong> {step.hint}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-1 shrink-0 border-t border-slate-800/60">
        <button
          type="button"
          onClick={onPrevStep}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-semibold text-slate-300 transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        <button
          type="button"
          onClick={onNextStep}
          disabled={currentStepIndex === TUTORIAL_STEPS.length - 1}
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-bold text-white transition shadow cursor-pointer"
        >
          {currentStepIndex === TUTORIAL_STEPS.length - 1 ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Complete
            </>
          ) : (
            <>
              Next <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
