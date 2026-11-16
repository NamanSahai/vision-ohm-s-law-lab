/**
 * LabSoundSynthesizer.ts
 * Pure Web Audio API procedural sound synthesizer for realistic laboratory tactile audio feedback.
 * Zero external audio files required. Completely synthesized in real time.
 */

class LabSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    // Automatically bind DOM click and touch listeners to unlock Web Audio in Safari/visionOS
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
      };
      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('pointerdown', unlock, { passive: true });
    }
  }

  public async unlockAudio(): Promise<boolean> {
    if (this.isMuted) return false;
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          await this.ctx.resume();
        }
        // Play an ultra-short 1-sample silent buffer to activate hardware audio output bus
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.isUnlocked = true;
        return true;
      }
    } catch (e) {
      console.warn('Web Audio unlock warning:', e);
    }
    return false;
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Crisp mechanical snap when knife switch closes into copper jaws
   */
  public playKnifeSwitchClose() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Initial metallic impact transient (sharp bandpass noise burst)
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.04));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.Q.setValueAtTime(4.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);

    // 2. Heavy copper bar resonant clack (low damped sine)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    oscGain.gain.setValueAtTime(0.70, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Tactile lever disengage flick when knife switch opens
   */
  public playKnifeSwitchOpen() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.06);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Heavy rocker switch tactile click (power supply ON/OFF)
   */
  public playPowerSwitch(on: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = on ? 350 : 520;
    const endFreq = on ? 680 : 280;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.04);

    gain.gain.setValueAtTime(0.80, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Subtle rotational detent tick when rotary voltage knob is adjusted
   */
  public playKnobTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.02);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  /**
   * Crisp, modern Apple spatial glassmorphic selection tap (1st terminal clicked)
   */
  public playTerminalSelect() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Ultra-clean high-frequency glass transient tap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, t); // A6 pure glass tone
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.018);

    gain.gain.setValueAtTime(0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.025);

    // 2. Micro wooden body click
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, t);
    osc2.frequency.exponentialRampToValueAtTime(220, t + 0.015);

    gain2.gain.setValueAtTime(0.45, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.02);
  }

  /**
   * Dual-stage tactile banana plug mechanical snap (2nd terminal clicked - wire connected)
   */
  public playWirePlug() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Stage 1: Metallic contact scratch/click (brass plug entering socket)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(2400, t);
    osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.012);

    gain1.gain.setValueAtTime(0.65, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.02);

    // Stage 2: Heavy beryllium-copper spring snap & solid seat (offset by 10ms)
    const tSnap = t + 0.010;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(620, tSnap);
    osc2.frequency.exponentialRampToValueAtTime(180, tSnap + 0.045);

    gain2.gain.setValueAtTime(0.85, tSnap);
    gain2.gain.exponentialRampToValueAtTime(0.001, tSnap + 0.05);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(tSnap);
    osc2.stop(tSnap + 0.06);
  }

  /**
   * Tactile wire unplug / spring release pop
   */
  public playWireUnplug() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Spring tension release pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.035);

    gain.gain.setValueAtTime(0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);

    // 2. High-frequency disengage click
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();

    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(1800, t);
    oscClick.frequency.exponentialRampToValueAtTime(800, t + 0.015);

    gainClick.gain.setValueAtTime(0.45, t);
    gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

    oscClick.connect(gainClick);
    gainClick.connect(ctx.destination);
    oscClick.start(t);
    oscClick.stop(t + 0.02);
  }

  /**
   * Subtle wooden/rubber table contact lift sound when an apparatus is picked up
   */
  public playApparatusGrab() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.035);

    gain.gain.setValueAtTime(0.50, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.045);
  }

  /**
   * Solid wooden workbench placement thud when an apparatus is put down
   */
  public playApparatusRelease() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.05);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Gentle digital confirmation chime when a reading is logged into observation table
   */
  public playReadingLogged() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const freqs = [880, 1174.66]; // A5 -> D6 chime
    freqs.forEach((freq, idx) => {
      const startTime = t + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  }
}

export const labAudio = new LabSoundSynthesizer();
