/**
 * Utility for converting Float32Array PCM to Base64 for the Gemini Live API.
 */
export function pcmToBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Utility for scheduling audio chunks for gapless playback.
 */
export class AudioPlayer {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  private nextStartTime: number = 0;
  private isInterrupted: boolean = false;

  constructor(sampleRate: number = 24000) {
    this.ctx = new AudioContext({ sampleRate });
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.ctx.destination);
    this.nextStartTime = this.ctx.currentTime;
  }

  async playChunk(base64: string) {
    if (this.isInterrupted) return;
    
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      const binary = atob(base64);
      const buffer = new ArrayBuffer(binary.length);
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const sampleCount = Math.floor(bytes.byteLength / 2);
      const int16 = new Int16Array(buffer, 0, sampleCount);
      const float32 = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.ctx.createBuffer(1, float32.length, this.ctx.sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);

      const startTime = Math.max(this.ctx.currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  }

  async interrupt() {
    this.isInterrupted = true;
    const oldCtx = this.ctx;
    this.ctx = new AudioContext({ sampleRate: 24000 });
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.ctx.destination);
    this.nextStartTime = this.ctx.currentTime;
    this.isInterrupted = false;
    await oldCtx.close();
  }

  getVolume() {
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data.reduce((a, b) => a + b, 0) / data.length;
  }
}
