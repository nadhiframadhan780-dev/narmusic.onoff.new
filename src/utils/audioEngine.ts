import { EqualizerPreset } from '../types';

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: 'Normal', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [7, 5, 1, -1, -2] },
  { name: 'Vokal', gains: [-2, 1, 6, 3, 0] },
  { name: 'Treble', gains: [-3, -1, 1, 5, 8] },
  { name: 'Rock', gains: [5, 3, -1, 3, 6] },
  { name: 'Pop', gains: [-1, 2, 5, 2, -2] },
];

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];

export class AudioEngine {
  private audio: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;

  private currentBlobUrl: string | null = null;
  private targetVolume = 1.0;
  private isMuted = false;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  /**
   * Inisialisasi AudioContext dan grafik Web Audio API saat interaksi pertama
   */
  public initWebAudio(): void {
    if (this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

      // Buat 5 band Equalizer
      this.filters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.0;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Buat Analyser untuk Visualizer
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      // Master Gain Node
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.targetVolume;

      // Sambungkan rantai Web Audio API:
      // Source -> Filter 0 -> Filter 1 -> ... -> Filter 4 -> Gain -> Analyser -> Destination
      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      lastNode.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio API inisialisasi fallback (menggunakan audio element standar):', err);
    }
  }

  public async resumeContext(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (err) {
        console.warn('Gagal resume AudioContext:', err);
      }
    }
  }

  /**
   * Muat audio dari Blob atau URL
   */
  public loadSource(blobOrUrl: Blob | string): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    if (blobOrUrl instanceof Blob) {
      this.currentBlobUrl = URL.createObjectURL(blobOrUrl);
      this.audio.src = this.currentBlobUrl;
    } else {
      this.audio.src = blobOrUrl;
    }

    this.audio.load();
  }

  public async play(crossfade = false, crossfadeDuration = 1): Promise<void> {
    this.initWebAudio();
    await this.resumeContext();

    if (crossfade && this.gainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.targetVolume, now + crossfadeDuration);
    } else if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.targetVolume;
    }

    return this.audio.play();
  }

  public pause(crossfade = false, crossfadeDuration = 0.5): void {
    if (crossfade && this.gainNode && this.audioCtx && !this.audio.paused) {
      const now = this.audioCtx.currentTime;
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(0, now + crossfadeDuration);
      setTimeout(() => {
        this.audio.pause();
        if (this.gainNode) this.gainNode.gain.value = this.isMuted ? 0 : this.targetVolume;
      }, crossfadeDuration * 1000);
    } else {
      this.audio.pause();
    }
  }

  public seek(seconds: number): void {
    if (isFinite(seconds) && seconds >= 0) {
      this.audio.currentTime = seconds;
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.targetVolume = clamped;
    this.audio.volume = clamped;
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : clamped;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.audio.muted = muted;
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : this.targetVolume;
    }
  }

  public setPlaybackRate(rate: number): void {
    this.audio.playbackRate = Math.max(0.5, Math.min(2.5, rate));
  }

  /**
   * Set equalizer gain per band (-12dB sampai +12dB)
   */
  public setEqualizerGains(gains: [number, number, number, number, number]): void {
    this.initWebAudio();
    if (!this.filters.length) return;

    gains.forEach((gain, index) => {
      if (this.filters[index]) {
        const clamped = Math.max(-12, Math.min(12, gain));
        this.filters[index].gain.value = clamped;
      }
    });
  }

  /**
   * Terapkan preset equalizer berdasarkan nama
   */
  public applyEqualizerPreset(presetName: string): [number, number, number, number, number] {
    const preset = EQUALIZER_PRESETS.find((p) => p.name.toLowerCase() === presetName.toLowerCase()) || EQUALIZER_PRESETS[0];
    this.setEqualizerGains(preset.gains);
    return preset.gains;
  }

  /**
   * Ambil data frekuensi visualizer untuk canvas
   */
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(0);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public destroy(): void {
    this.audio.pause();
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
    }
  }
}

// Singleton Audio Engine
export const audioEngine = new AudioEngine();
