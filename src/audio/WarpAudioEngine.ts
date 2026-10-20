/**
 * Procedural Spatial Audio Engine for Alcubierre Warp Drive
 * Synthesizes dynamic, low-frequency gravitational hums and exotic field resonance
 * using pure Web Audio API oscillators and filters (zero external audio files).
 */

import { WarpParameters } from '../physics/types';

export class WarpAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled = false;
  private masterVolume = 0.45;

  // Audio Nodes
  private masterGain: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;

  // Sub-bass oscillator (fundamental gravitational hum)
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;

  // Mid harmonic oscillator (warp coil plasma whine)
  private midOsc: OscillatorNode | null = null;
  private midGain: GainNode | null = null;

  // Resonant Low-Pass Filter (represents the bubble boundary)
  private warpFilter: BiquadFilterNode | null = null;

  // LFO (warp coil pulsing throb)
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private currentParams: WarpParameters | null = null;

  /**
   * Initializes or resumes the AudioContext on user interaction
   */
  public async init(): Promise<boolean> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('Web Audio API not supported in this browser.');
        return false;
      }
      this.ctx = new AudioCtxClass();
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
        return false;
      }
    }

    return true;
  }

  /**
   * Starts the procedural sound synthesis
   */
  public async start(initialParams: WarpParameters): Promise<boolean> {
    const ready = await this.init();
    if (!ready || !this.ctx) return false;

    if (this.isEnabled) return true;

    this.currentParams = { ...initialParams };
    const now = this.ctx.currentTime;

    // 1. Master Output Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, now + 0.5);

    // 2. Spatial Stereo Panner (spatialization along travel axis X)
    if (this.ctx.createStereoPanner) {
      this.pannerNode = this.ctx.createStereoPanner();
      this.pannerNode.pan.setValueAtTime(
        Math.max(-1, Math.min(1, initialParams.xCenter / 3.5)),
        now
      );
      this.masterGain.connect(this.pannerNode);
      this.pannerNode.connect(this.ctx.destination);
    } else {
      this.masterGain.connect(this.ctx.destination);
    }

    // 3. Resonant Biquad Filter (models spatial curvature cavity)
    this.warpFilter = this.ctx.createBiquadFilter();
    this.warpFilter.type = 'lowpass';
    this.warpFilter.connect(this.masterGain);

    // 4. LFO (Pulsing throb for warp coils)
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.type = 'sine';
    this.lfoGain = this.ctx.createGain();
    this.lfoOsc.connect(this.lfoGain);

    // 5. Sub-bass Oscillator (sine wave deep hum)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subGain = this.ctx.createGain();
    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.warpFilter);

    // 6. Mid Harmonic Oscillator (triangle wave for plasma resonance)
    this.midOsc = this.ctx.createOscillator();
    this.midOsc.type = 'triangle';
    this.midGain = this.ctx.createGain();
    this.midOsc.connect(this.midGain);
    this.midGain.connect(this.warpFilter);

    // Modulate filter cutoff with LFO for rhythmic breathing/throb
    this.lfoGain.connect(this.warpFilter.frequency);

    // Start oscillators
    this.subOsc.start(now);
    this.midOsc.start(now);
    this.lfoOsc.start(now);

    this.isEnabled = true;
    this.updateParams(initialParams);

    return true;
  }

  /**
   * Modulate pitch, filter harmonics, LFO pulse rate, and spatial pan in real time
   * based on velocity, bubbleRadius, wallSharpness, and travel position xCenter.
   */
  public updateParams(params: WarpParameters): void {
    if (!this.isEnabled || !this.ctx || !this.subOsc || !this.midOsc || !this.warpFilter || !this.lfoOsc || !this.lfoGain || !this.subGain || !this.midGain) {
      return;
    }

    this.currentParams = { ...params };
    const now = this.ctx.currentTime;
    const rampTime = 0.08; // Smooth, instantaneous response without clicking

    const { velocity, bubbleRadius, wallSharpness, xCenter, isCruising } = params;

    // A. Pitch / Frequency modulation:
    // - Sub-bass fundamental: Base 42 Hz at subluminal (0.1c), rising logarithmically to ~110 Hz at 6c.
    // - Larger bubble radius adds cavity depth (lower pitch), smaller radius compresses harmonics.
    const radiusPitchFactor = Math.max(0.6, Math.min(1.4, 1.0 / Math.sqrt(bubbleRadius)));
    const baseSubFreq = (38 + velocity * 14) * radiusPitchFactor;
    this.subOsc.frequency.setTargetAtTime(baseSubFreq, now, rampTime);

    // - Mid-range harmonic: Tripled/quadrupled frequency representing electromagnetic warp coils
    const midFreq = baseSubFreq * 2.85;
    this.midOsc.frequency.setTargetAtTime(midFreq, now, rampTime);

    // B. Filter Cutoff & Resonance (Q):
    // - Higher velocity opens the filter cutoff to reveal brighter relativistic harmonics.
    // - Higher wall sharpness (sigma) increases resonance peak (Q factor).
    const filterBaseCutoff = (160 + velocity * 85 + (1.0 / bubbleRadius) * 50);
    this.warpFilter.frequency.setTargetAtTime(filterBaseCutoff, now, rampTime);
    const filterQ = Math.min(12, 1.5 + (wallSharpness / 3.0));
    this.warpFilter.Q.setTargetAtTime(filterQ, now, rampTime);

    // C. LFO Throb Rate:
    // - Warp ring pulsation frequency increases with velocity (e.g. 1.2 Hz idle -> 7.5 Hz at warp factor 5)
    const lfoRate = Math.min(10.0, 1.2 + velocity * 1.1);
    this.lfoOsc.frequency.setTargetAtTime(lfoRate, now, rampTime);

    // LFO modulation depth
    const lfoDepth = 35 + velocity * 25;
    this.lfoGain.gain.setTargetAtTime(lfoDepth, now, rampTime);

    // D. Relative balances:
    // Sub hum is steady and powerful
    const subVolume = 0.65;
    this.subGain.gain.setTargetAtTime(subVolume, now, rampTime);

    // Mid plasma whine swells with higher velocity
    const midVolume = Math.min(0.4, 0.08 + velocity * 0.05);
    this.midGain.gain.setTargetAtTime(midVolume, now, rampTime);

    // E. Spatial Stereo Panning:
    // Maps xCenter (-3.5 to +3.5) to pan (-0.85 to +0.85)
    if (this.pannerNode) {
      const panValue = Math.max(-0.85, Math.min(0.85, xCenter / 3.5));
      this.pannerNode.pan.setTargetAtTime(panValue, now, rampTime);
    }
  }

  /**
   * Adjust master volume (0.0 to 1.0)
   */
  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Stop audio synthesis cleanly
   */
  public stop(): void {
    if (!this.isEnabled || !this.ctx) return;

    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.25);
    }

    setTimeout(() => {
      try {
        this.subOsc?.stop();
        this.midOsc?.stop();
        this.lfoOsc?.stop();
        this.subOsc?.disconnect();
        this.midOsc?.disconnect();
        this.lfoOsc?.disconnect();
      } catch (e) {
        // Ignored if already stopped
      }
      this.isEnabled = false;
    }, 300);
  }

  public getIsActive(): boolean {
    return this.isEnabled;
  }

  public getVolume(): number {
    return this.masterVolume;
  }
}

// Global singleton instance for clean lifecycle
export const warpAudio = new WarpAudioEngine();
