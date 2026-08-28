// public/audio-processor.js
// Modern Web Audio Worklet for 16kHz PCM audio capturing
class LivePCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // ~128ms chunking at 16kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.bufferIndex++] = channelData[i];
        if (this.bufferIndex >= this.bufferSize) {
          // Send chunk to main thread
          this.port.postMessage(this.buffer.slice(0, this.bufferSize));
          this.bufferIndex = 0;
        }
      }
    }
    return true; // Keep processor active
  }
}

registerProcessor('live-pcm-processor', LivePCMProcessor);
