import type { WireConnection, CircuitStatus, TerminalId } from '../types/circuit';

export class ElectricalEngine {
  public isPowerOn: boolean = false;
  public isSwitchClosed: boolean = true;
  public appliedVoltage: number = 5.0; // Initial 5V
  public nominalResistance: number = 100.0; // 100 Ohms
  public ammeterInternalResistance: number = 0.05; // 0.05 Ohms (near zero)
  public voltmeterInternalResistance: number = 10000000.0; // 10 MOhms (near infinite)
  public maxResistorPower: number = 2.0; // 2 Watts max rating

  private wires: WireConnection[] = [];

  constructor() {
    // Starts with clean state
  }

  public setPowerOn(on: boolean): CircuitStatus {
    this.isPowerOn = on;
    return this.solve();
  }

  public setSwitchClosed(closed: boolean): CircuitStatus {
    this.isSwitchClosed = closed;
    return this.solve();
  }

  public setVoltage(voltage: number): CircuitStatus {
    this.appliedVoltage = Math.max(0, Math.min(10.0, voltage));
    return this.solve();
  }

  public setWires(wires: WireConnection[]): CircuitStatus {
    this.wires = [...wires];
    return this.solve();
  }

  public addWire(wire: WireConnection): CircuitStatus {
    this.wires.push(wire);
    return this.solve();
  }

  public removeWire(id: string): CircuitStatus {
    this.wires = this.wires.filter((w) => w.id !== id);
    return this.solve();
  }

  public clearWires(): CircuitStatus {
    this.wires = [];
    return this.solve();
  }

  public getWires(): WireConnection[] {
    return this.wires;
  }

  /**
   * Helper to check if two terminals are electrically connected through one or more wires
   */
  private areTerminalsConnected(start: TerminalId, target: TerminalId, visited: Set<TerminalId> = new Set()): boolean {
    if (start === target) return true;
    visited.add(start);

    for (const wire of this.wires) {
      let next: TerminalId | null = null;
      if (wire.fromTerminal === start && !visited.has(wire.toTerminal)) {
        next = wire.toTerminal;
      } else if (wire.toTerminal === start && !visited.has(wire.fromTerminal)) {
        next = wire.fromTerminal;
      }

      if (next) {
        if (next === target) return true;
        if (this.areTerminalsConnected(next, target, visited)) return true;
      }
    }

    return false;
  }

  /**
   * Solves the electrical circuit state using Ohm's Law and connectivity graphs
   */
  public solve(): CircuitStatus {
    // If power supply is off
    if (!this.isPowerOn) {
      return {
        isPowerOn: false,
        isSwitchClosed: this.isSwitchClosed,
        appliedVoltage: this.appliedVoltage,
        nominalResistance: this.nominalResistance,
        actualResistance: this.nominalResistance,
        circuitCurrent: 0,
        currentMilliamps: 0,
        voltmeterReading: 0,
        ammeterReading: 0,
        isCircuitClosed: false,
        isCorrectTopology: false,
        statusMessage: 'Power Supply is OFF. Switch ON to energize circuit.',
        hasShortCircuit: false,
        hasOpenCircuit: true,
        resistorPowerDissipated: 0,
        isResistorOverheated: false,
      };
    }

    // Check Short Circuit: Direct connection from PS (+) to PS (-) without series resistor
    const directShort = this.areTerminalsConnected('ps_pos', 'ps_neg');
    if (directShort && this.wires.length > 0) {
      // Check if it bypassed the resistor
      const hasResistor = this.areTerminalsConnected('ps_pos', 'resistor_t1') && this.areTerminalsConnected('resistor_t2', 'ps_neg');
      if (!hasResistor) {
        return {
          isPowerOn: true,
          isSwitchClosed: this.isSwitchClosed,
          appliedVoltage: this.appliedVoltage,
          nominalResistance: this.nominalResistance,
          actualResistance: 0.1,
          circuitCurrent: 2.0, // Tripped limit
          currentMilliamps: 2000,
          voltmeterReading: 0,
          ammeterReading: 2000,
          isCircuitClosed: true,
          isCorrectTopology: false,
          statusMessage: 'DANGER: SHORT CIRCUIT DETECTED! Power supply protection activated.',
          hasShortCircuit: true,
          hasOpenCircuit: false,
          resistorPowerDissipated: 0,
          isResistorOverheated: false,
        };
      }
    }

    // Check Switch: if switch is in the loop, check if it's open
    const hasSwitchInLoop = this.wires.some(
      (w) => w.fromTerminal.startsWith('sw_') || w.toTerminal.startsWith('sw_')
    );
    if (hasSwitchInLoop && !this.isSwitchClosed) {
      return {
        isPowerOn: true,
        isSwitchClosed: false,
        appliedVoltage: this.appliedVoltage,
        nominalResistance: this.nominalResistance,
        actualResistance: this.nominalResistance,
        circuitCurrent: 0,
        currentMilliamps: 0,
        voltmeterReading: 0,
        ammeterReading: 0,
        isCircuitClosed: false,
        isCorrectTopology: false,
        statusMessage: 'Open Circuit: Knife Switch is OPEN. Close knife switch to allow current flow.',
        hasShortCircuit: false,
        hasOpenCircuit: true,
        resistorPowerDissipated: 0,
        isResistorOverheated: false,
      };
    }

    // Check Series Loop Connectivity:
    // Expected series path:
    // PS(+) -> [Switch] -> Ammeter(+) -> Ammeter(-) -> Resistor(T1) -> Resistor(T2) -> PS(-)
    // or (Resistor and Ammeter order swapped in series loop is also physically valid in physics!)
    const psPosToAmmeter = this.areTerminalsConnected('ps_pos', 'ammeter_pos') ||
      (this.areTerminalsConnected('ps_pos', 'sw_in') && this.areTerminalsConnected('sw_out', 'ammeter_pos'));
    const ammeterToResistor = this.areTerminalsConnected('ammeter_neg', 'resistor_t1');
    const resistorToPsNeg = this.areTerminalsConnected('resistor_t2', 'ps_neg');

    // Alternative valid series loop: PS(+) -> Resistor -> Ammeter -> PS(-)
    const altPosToResistor = this.areTerminalsConnected('ps_pos', 'resistor_t1') ||
      (this.areTerminalsConnected('ps_pos', 'sw_in') && this.areTerminalsConnected('sw_out', 'resistor_t1'));
    const altResistorToAmmeter = this.areTerminalsConnected('resistor_t2', 'ammeter_pos');
    const altAmmeterToPsNeg = this.areTerminalsConnected('ammeter_neg', 'ps_neg');

    const isSeriesLoopComplete = (psPosToAmmeter && ammeterToResistor && resistorToPsNeg) ||
      (altPosToResistor && altResistorToAmmeter && altAmmeterToPsNeg);

    // Check Voltmeter Parallel Connection:
    // Voltmeter (+) to Resistor T1 AND Voltmeter (-) to Resistor T2
    const voltMeterConnected =
      (this.areTerminalsConnected('voltmeter_pos', 'resistor_t1') && this.areTerminalsConnected('voltmeter_neg', 'resistor_t2')) ||
      (this.areTerminalsConnected('voltmeter_pos', 'resistor_t2') && this.areTerminalsConnected('voltmeter_neg', 'resistor_t1'));

    // Check if Ammeter was accidentally placed in parallel (incorrect placement error)
    const ammeterInParallel = this.areTerminalsConnected('ammeter_pos', 'resistor_t1') &&
      this.areTerminalsConnected('ammeter_neg', 'resistor_t2');

    if (ammeterInParallel) {
      return {
        isPowerOn: true,
        isSwitchClosed: this.isSwitchClosed,
        appliedVoltage: this.appliedVoltage,
        nominalResistance: this.nominalResistance,
        actualResistance: 0.1,
        circuitCurrent: 2.0,
        currentMilliamps: 2000,
        voltmeterReading: 0,
        ammeterReading: 2000,
        isCircuitClosed: true,
        isCorrectTopology: false,
        statusMessage: 'FAULT: Ammeter is connected in parallel across the resistor! Ammeters must be in SERIES.',
        hasShortCircuit: true,
        hasOpenCircuit: false,
        resistorPowerDissipated: 0,
        isResistorOverheated: false,
      };
    }

    if (!isSeriesLoopComplete) {
      return {
        isPowerOn: true,
        isSwitchClosed: this.isSwitchClosed,
        appliedVoltage: this.appliedVoltage,
        nominalResistance: this.nominalResistance,
        actualResistance: this.nominalResistance,
        circuitCurrent: 0,
        currentMilliamps: 0,
        voltmeterReading: 0,
        ammeterReading: 0,
        isCircuitClosed: false,
        isCorrectTopology: false,
        statusMessage: 'Open Circuit: Incomplete wiring loop. Connect wires from Supply through Ammeter and Resistor to Ground.',
        hasShortCircuit: false,
        hasOpenCircuit: true,
        resistorPowerDissipated: 0,
        isResistorOverheated: false,
      };
    }

    // Mathematical Ohm's Law Calculation:
    // I = V / R
    const totalResistance = this.nominalResistance + this.ammeterInternalResistance;
    const currentAmps = this.appliedVoltage / totalResistance;
    const currentMilliamps = currentAmps * 1000.0; // Convert to mA

    // Voltage across resistor: V_R = I * R
    const resistorVoltage = currentAmps * this.nominalResistance;

    // Power dissipation in resistor: P = I^2 * R
    const powerDissipated = Math.pow(currentAmps, 2) * this.nominalResistance;
    const isOverheated = powerDissipated > this.maxResistorPower;

    const isTopologyFullyCorrect = isSeriesLoopComplete && voltMeterConnected;

    const statusMessage = isTopologyFullyCorrect
      ? `Circuit Active & Valid! V = ${this.appliedVoltage.toFixed(2)} V, I = ${currentMilliamps.toFixed(1)} mA (R = ${(resistorVoltage / currentAmps).toFixed(1)} Ω).`
      : isSeriesLoopComplete && !voltMeterConnected
      ? `Series loop complete! Current = ${currentMilliamps.toFixed(1)} mA. Connect the Voltmeter in parallel across Resistor T1 and T2 to measure voltage.`
      : 'Review circuit connections.';

    return {
      isPowerOn: true,
      isSwitchClosed: this.isSwitchClosed,
      appliedVoltage: this.appliedVoltage,
      nominalResistance: this.nominalResistance,
      actualResistance: this.nominalResistance,
      circuitCurrent: currentAmps,
      currentMilliamps: currentMilliamps,
      voltmeterReading: voltMeterConnected ? resistorVoltage : 0,
      ammeterReading: isSeriesLoopComplete ? currentMilliamps : 0,
      isCircuitClosed: true,
      isCorrectTopology: isTopologyFullyCorrect,
      statusMessage,
      hasShortCircuit: false,
      hasOpenCircuit: false,
      resistorPowerDissipated: powerDissipated,
      isResistorOverheated: isOverheated,
    };
  }
}
