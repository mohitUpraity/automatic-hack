/**
 * Audio Manager for Gemini Live Multimodal API
 * - Input: 16kHz 16-bit Linear PCM Little-Endian
 * - Output: 24kHz 16-bit Linear PCM Little-Endian
 */
export class AudioStreamingManager {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private inputSourceNode: MediaStreamAudioSourceNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  private scheduledSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;
  private onAudioChunkCallback: ((base64Pcm: string) => void) | null = null;
  private onVolumeChangeCallback: ((inputVolume: number, outputVolume: number) => void) | null = null;
  private isMuted: boolean = false;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  public setOnAudioChunk(cb: (base64Pcm: string) => void) {
    this.onAudioChunkCallback = cb;
  }

  public setOnVolumeChange(cb: (inputVol: number, outputVol: number) => void) {
    this.onVolumeChangeCallback = cb;
  }

  public async startAudioCapture(stream: MediaStream): Promise<void> {
    this.mediaStream = stream;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    // Input: 16kHz for Gemini Live WebSocket protocol
    this.inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
    // Output: 24kHz for Gemini Live high-fidelity speech
    this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });

    if (this.inputAudioCtx.state === "suspended") {
      await this.inputAudioCtx.resume();
    }
    if (this.outputAudioCtx.state === "suspended") {
      await this.outputAudioCtx.resume();
    }

    this.inputAnalyser = this.inputAudioCtx.createAnalyser();
    this.inputAnalyser.fftSize = 64;
    this.inputAnalyser.smoothingTimeConstant = 0.5;

    this.outputAnalyser = this.outputAudioCtx.createAnalyser();
    this.outputAnalyser.fftSize = 64;
    this.outputAnalyser.smoothingTimeConstant = 0.5;

    this.inputSourceNode = this.inputAudioCtx.createMediaStreamSource(stream);
    this.inputSourceNode.connect(this.inputAnalyser);

    // 4096 buffer size at 16kHz yields smooth ~256ms audio frames
    this.processorNode = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRunning || this.isMuted) return;

      const channelData = e.inputBuffer.getChannelData(0);
      const base64Pcm = this.floatTo16BitPCMBase64(channelData);
      if (this.onAudioChunkCallback) {
        this.onAudioChunkCallback(base64Pcm);
      }
    };

    this.inputAnalyser.connect(this.processorNode);
    this.processorNode.connect(this.inputAudioCtx.destination);

    this.isRunning = true;
    this.startVolumeMonitoring();
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Converts Float32Array to 16-bit PCM (little-endian) Base64
   */
  private floatTo16BitPCMBase64(float32Array: Float32Array): string {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(i * 2, val, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Gapless 24kHz playback for audio chunks received from Gemini Live
   */
  public playAudioChunk(base64Pcm: string) {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === "closed") return;

    if (this.outputAudioCtx.state === "suspended") {
      this.outputAudioCtx.resume();
    }

    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const dataView = new DataView(bytes.buffer);
      const sampleCount = Math.floor(len / 2);
      const float32Array = new Float32Array(sampleCount);

      for (let i = 0; i < sampleCount; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, sampleCount, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;

      if (this.outputAnalyser) {
        sourceNode.connect(this.outputAnalyser);
        this.outputAnalyser.connect(this.outputAudioCtx.destination);
      } else {
        sourceNode.connect(this.outputAudioCtx.destination);
      }

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      sourceNode.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      this.scheduledSources.push(sourceNode);

      sourceNode.onended = () => {
        const idx = this.scheduledSources.indexOf(sourceNode);
        if (idx !== -1) {
          this.scheduledSources.splice(idx, 1);
        }
      };
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  }

  /**
   * Full-duplex interruption cutoff (stops active speech instantly)
   */
  public stopPlayback() {
    this.scheduledSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {}
    });
    this.scheduledSources = [];
    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }
  }

  private startVolumeMonitoring() {
    const checkVolume = () => {
      let inputVol = 0;
      let outputVol = 0;

      if (this.inputAnalyser && !this.isMuted) {
        const dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
        this.inputAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        inputVol = sum / dataArray.length / 255;
      }

      if (this.outputAnalyser && this.scheduledSources.length > 0) {
        const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
        this.outputAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        outputVol = sum / dataArray.length / 255;
      }

      if (this.onVolumeChangeCallback) {
        this.onVolumeChangeCallback(inputVol, outputVol);
      }

      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(checkVolume);
      }
    };

    this.animationFrameId = requestAnimationFrame(checkVolume);
  }

  public cleanup() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.stopPlayback();

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.inputSourceNode) {
      this.inputSourceNode.disconnect();
      this.inputSourceNode = null;
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== "closed") {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx && this.outputAudioCtx.state !== "closed") {
      this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }
  }
}
