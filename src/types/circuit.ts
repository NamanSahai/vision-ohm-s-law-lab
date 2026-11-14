export type TerminalId =
  | 'ps_pos'      // Power Supply (+) Positive (Red)
  | 'ps_neg'      // Power Supply (-) Negative (Black)
  | 'ps_gnd'      // Power Supply GND (Green)
  | 'sw_in'       // Switch input terminal
  | 'sw_out'      // Switch output terminal
  | 'ammeter_pos' // Ammeter (+) Positive
  | 'ammeter_neg' // Ammeter (-) Negative / COM
  | 'resistor_t1' // Resistor Terminal 1
  | 'resistor_t2' // Resistor Terminal 2
  | 'voltmeter_pos' // Voltmeter (+) Positive
  | 'voltmeter_neg';// Voltmeter (-) Negative / COM

export interface TerminalDefinition {
  id: TerminalId;
  name: string;
  component: string;
  polarity: 'positive' | 'negative' | 'neutral';
  color: string;
  position: [number, number, number]; // local offset relative to component
}

export type WireColor = 'red' | 'black' | 'yellow' | 'blue' | 'green';

export interface WireConnection {
  id: string;
  color: WireColor;
  fromTerminal: TerminalId;
  toTerminal: TerminalId;
}

export interface ObservationReading {
  id: string;
  readingNumber: number;
  voltage: number;   // Volts
  current: number;   // Milliamps
  resistance: number;// Ohms (V / I)
  timestamp: string;
}

export type ExperimentMode = 'tutorial' | 'experimental' | 'free_explore';

export interface CircuitStatus {
  isPowerOn: boolean;
  isSwitchClosed: boolean;
  appliedVoltage: number;    // V (0 - 10V)
  nominalResistance: number; // 100 Ω
  actualResistance: number;  // Ω (with thermal variation)
  circuitCurrent: number;    // A
  currentMilliamps: number;  // mA
  voltmeterReading: number;  // V
  ammeterReading: number;    // mA
  isCircuitClosed: boolean;
  isCorrectTopology: boolean;
  statusMessage: string;
  hasShortCircuit: boolean;
  hasOpenCircuit: boolean;
  resistorPowerDissipated: number; // Watts (I^2 * R)
  isResistorOverheated: boolean;
}
