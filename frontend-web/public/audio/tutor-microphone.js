class TutorMicrophone extends AudioWorkletProcessor {
  process(inputs) {
    const samples = inputs[0]?.[0];
    if (samples) {
      const pcm = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) pcm[i] = Math.max(-1, Math.min(1, samples[i])) * 32767;
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}
registerProcessor('tutor-microphone', TutorMicrophone);
