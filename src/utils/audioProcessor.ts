/**
 * Clones an AudioBuffer to avoid mutating the original instance.
 */
export function cloneAudioBuffer(buffer: AudioBuffer) {
  const clone = new AudioBuffer({
    length: buffer.length,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  });
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    clone.copyToChannel(buffer.getChannelData(channel), channel);
  }
  return clone;
}

/**
 * Reverses the samples for every channel in the buffer.
 */
export function reverseAudioBuffer(buffer: AudioBuffer) {
  const cloned = cloneAudioBuffer(buffer);
  for (let channel = 0; channel < cloned.numberOfChannels; channel += 1) {
    const channelData = cloned.getChannelData(channel);
    channelData.reverse();
  }
  return cloned;
}

/**
 * Mixes a buffer down to mono.
 */
export function mixToMono(buffer: AudioBuffer) {
  if (buffer.numberOfChannels === 1) {
    return buffer;
  }
  const monoBuffer = new AudioBuffer({
    length: buffer.length,
    numberOfChannels: 1,
    sampleRate: buffer.sampleRate,
  });
  const output = monoBuffer.getChannelData(0);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i += 1) {
      output[i] += channelData[i] / buffer.numberOfChannels;
    }
  }
  return monoBuffer;
}

/**
 * Normalizes a buffer to a target peak amplitude.
 */
export function normalizeAudioBuffer(buffer: AudioBuffer, targetPeak = 0.9) {
  const cloned = cloneAudioBuffer(buffer);
  let peak = 0;
  for (let channel = 0; channel < cloned.numberOfChannels; channel += 1) {
    const channelData = cloned.getChannelData(channel);
    for (let i = 0; i < channelData.length; i += 1) {
      peak = Math.max(peak, Math.abs(channelData[i]));
    }
  }
  if (peak === 0) {
    return cloned;
  }
  const gain = targetPeak / peak;
  for (let channel = 0; channel < cloned.numberOfChannels; channel += 1) {
    const channelData = cloned.getChannelData(channel);
    for (let i = 0; i < channelData.length; i += 1) {
      channelData[i] *= gain;
    }
  }
  return cloned;
}
