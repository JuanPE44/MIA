// Web Audio API ambient sounds and speech synthesis for student concentration

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private currentAmbientNodes: { source: AudioNode; gain: GainNode }[] = [];
  private ambientType: string | null = null;
  private ambientGain: GainNode | null = null;

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play warning beep when Focus mode detects tab switch or exit
  public playTamperWarning() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.audioCtx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  // Play alarm bell chime when Pomodoro stage finishes
  public playStageAlarm() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      // Two-phase melodious ringing chime (E5 -> G#5 -> B5 -> E6) repeated twice
      const notes = [659.25, 830.61, 987.77, 1318.51, 659.25, 830.61, 987.77, 1318.51];
      const now = this.audioCtx.currentTime;

      notes.forEach((freq, idx) => {
        const offset = idx < 4 ? idx * 0.12 : 0.65 + (idx - 4) * 0.12;
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0.28, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.55);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.55);
      });
    } catch {
      // AudioContext fallback
    }
  }

  // Play gentle bell when Pomodoro completes successfully
  public playSuccessChime() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C Major chord
      frequencies.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.18, this.audioCtx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx!.currentTime + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(this.audioCtx!.currentTime + idx * 0.08);
        osc.stop(this.audioCtx!.currentTime + idx * 0.08 + 1.2);
      });
    } catch {
      // AudioContext fallback
    }
  }

  // Play ambient background noise (Rain, Binaural 40Hz, Coffee Shop White Noise)
  public startAmbient(type: 'rain' | 'binaural' | 'cafe' | 'whitenoise', volume: number = 0.35) {
    this.stopAmbient();
    this.initCtx();
    if (!this.audioCtx) return;

    // Ensure audio context is active
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.ambientType = type;
    const masterGain = this.audioCtx.createGain();
    const targetVol = type === 'rain' ? Math.max(volume, 0.35) : volume;
    masterGain.gain.setValueAtTime(targetVol, this.audioCtx.currentTime);
    masterGain.connect(this.audioCtx.destination);
    this.ambientGain = masterGain;

    if (type === 'binaural') {
      // 40Hz Gamma wave for deep focus (left ear 200Hz, right ear 240Hz)
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const pan1 = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;
      const pan2 = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(200, this.audioCtx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(240, this.audioCtx.currentTime);

      if (pan1 && pan2) {
        pan1.pan.setValueAtTime(-0.8, this.audioCtx.currentTime);
        pan2.pan.setValueAtTime(0.8, this.audioCtx.currentTime);
        osc1.connect(pan1);
        pan1.connect(masterGain);
        osc2.connect(pan2);
        pan2.connect(masterGain);
      } else {
        osc1.connect(masterGain);
        osc2.connect(masterGain);
      }

      osc1.start();
      osc2.start();
      this.currentAmbientNodes.push({ source: osc1, gain: masterGain }, { source: osc2, gain: masterGain });
    } else {
      // High-fidelity noise buffer for Rain, Cafe, White Noise
      const sampleRate = this.audioCtx.sampleRate;
      const bufferSize = sampleRate * 3;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0;
      let lastOut = 0.0;
      let dropEnv = 0.0;
      let dropFreq = 1600;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        if (type === 'rain') {
          // Paul Kellet's filter for true acoustic pink noise (-3dB/octave), the foundation of falling water
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = (b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362) * 0.14;

          // Occasional organic gentle raindrops hitting a window/roof
          if (Math.random() < 0.00045) {
            dropEnv = 0.35;
            dropFreq = 1200 + Math.random() * 1000;
          }
          let droplet = 0;
          if (dropEnv > 0.001) {
            droplet = Math.sin((2 * Math.PI * dropFreq * i) / sampleRate) * dropEnv;
            dropEnv *= 0.998;
          }

          // Gentle ambient wave
          const gentleBreeze = 0.92 + 0.08 * Math.sin((2 * Math.PI * 0.12 * i) / sampleRate);
          data[i] = (pink * 0.85 + droplet * 0.15) * gentleBreeze;
        } else if (type === 'cafe') {
          // Warm filtered rumble
          lastOut = (lastOut + 0.04 * white) / 1.04;
          data[i] = lastOut * 2.8;
        } else {
          // Classic smooth white noise
          data[i] = white * 0.15;
        }
      }

      const noiseSource = this.audioCtx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter cascade
      const filter = this.audioCtx.createBiquadFilter();
      if (type === 'rain') {
        // Highpass to eliminate low muddiness + gentle lowpass for crisp soothing rain sound
        const highpass = this.audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(280, this.audioCtx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, this.audioCtx.currentTime);
        filter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

        noiseSource.connect(highpass);
        highpass.connect(filter);
        filter.connect(masterGain);
      } else if (type === 'cafe') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);
        noiseSource.connect(filter);
        filter.connect(masterGain);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
        noiseSource.connect(filter);
        filter.connect(masterGain);
      }

      noiseSource.start();
      this.currentAmbientNodes.push({ source: noiseSource, gain: masterGain });
    }
  }

  public setVolume(volume: number) {
    if (this.ambientGain && this.audioCtx) {
      this.ambientGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    }
  }

  public stopAmbient() {
    this.currentAmbientNodes.forEach(item => {
      try {
        if ('stop' in item.source && typeof (item.source as AudioScheduledSourceNode).stop === 'function') {
          (item.source as AudioScheduledSourceNode).stop();
        }
      } catch {
        // already stopped
      }
    });
    this.currentAmbientNodes = [];
    this.ambientType = null;
    this.ambientGain = null;
  }

  public getActiveAmbient() {
    return this.ambientType;
  }
}

export const soundManager = new SoundManager();

// Speech synthesis for podcast episodes
export class PodcastSpeaker {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static utterance: SpeechSynthesisUtterance | null = null;

  public static speakLine(
    text: string,
    speaker: 'Sofía (Host)' | 'Lucas (Co-host)',
    rate: number = 1.0,
    onEnd?: () => void
  ) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.stop();

    const cleanText = text.replace(/[*#_]/g, '');
    this.utterance = new SpeechSynthesisUtterance(cleanText);
    this.utterance.rate = rate;
    this.utterance.lang = 'es-ES';

    // Different pitch for host vs co-host
    if (speaker.includes('Sofía')) {
      this.utterance.pitch = 1.15;
    } else {
      this.utterance.pitch = 0.88;
    }

    if (onEnd) {
      this.utterance.onend = () => onEnd();
      this.utterance.onerror = () => onEnd();
    }

    this.synth.speak(this.utterance);
  }

  public static pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public static resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
