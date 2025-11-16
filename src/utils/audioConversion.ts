import { DEFAULT_SAMPLE_RATE } from "@/utils/audioConstants";

const WAV_HEADER_SIZE = 44;

export async function blobToArrayBuffer(blob: Blob) {
  return blob.arrayBuffer();
}

export async function blobToAudioBuffer(blob: Blob, audioContext?: AudioContext) {
  const arrayBuffer = await blobToArrayBuffer(blob);
  let context = audioContext;
  if (!context) {
    if (typeof window === "undefined") {
      throw new Error("AudioContext is not available during SSR");
    }
    context = new AudioContext();
  }
  try {
    return await context.decodeAudioData(arrayBuffer.slice(0));
  } catch (decodeError) {
    console.error("Failed to decode audio:", decodeError);
    throw decodeError;
  }
}

export function audioBufferToWavBlob(buffer: AudioBuffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate || DEFAULT_SAMPLE_RATE;
  const frameCount = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const bufferLength = WAV_HEADER_SIZE + frameCount * blockAlign;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  let offset = 0;

  const writeString = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset, value.charCodeAt(i));
      offset += 1;
    }
  };

  const writeUint32 = (value: number) => {
    view.setUint32(offset, value, true);
    offset += 4;
  };

  const writeUint16 = (value: number) => {
    view.setUint16(offset, value, true);
    offset += 2;
  };

  writeString("RIFF");
  writeUint32(bufferLength - 8);
  writeString("WAVE");
  writeString("fmt ");
  writeUint32(16);
  writeUint16(1);
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(sampleRate * blockAlign);
  writeUint16(blockAlign);
  writeUint16(bytesPerSample * 8);
  writeString("data");
  writeUint32(frameCount * blockAlign);

  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < numChannels; channel += 1) {
      const channelData = buffer.getChannelData(channel);
      const sample = Math.max(-1, Math.min(1, channelData[frame]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export async function audioBufferToBase64(buffer: AudioBuffer) {
  const wavBlob = audioBufferToWavBlob(buffer);
  const arrayBuffer = await blobToArrayBuffer(wavBlob);
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
