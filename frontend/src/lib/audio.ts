// MediaRecorder only produces compressed formats (webm/opus, mp4/aac...),
// which the backend's librosa/soundfile pipeline can't decode without a
// system ffmpeg install. Rather than add that system dependency, we decode
// the recording right here in the browser (the same engine that recorded
// it can always play it back) and re-encode to a plain WAV file before
// upload — a format soundfile reads natively, with zero backend changes.
export async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer()
  const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext
  const audioContext = new AudioCtx()

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    return encodeWav(audioBuffer)
  } finally {
    await audioContext.close()
  }
}

function encodeWav(audioBuffer: AudioBuffer): Blob {
  const sampleRate = audioBuffer.sampleRate
  const numChannels = audioBuffer.numberOfChannels
  const length = audioBuffer.length

  // Downmix to mono — voice matching doesn't need stereo, and it keeps
  // the encoder simple.
  const mono = new Float32Array(length)
  for (let channel = 0; channel < numChannels; channel++) {
    const data = audioBuffer.getChannelData(channel)
    for (let i = 0; i < length; i++) mono[i] += data[i] / numChannels
  }

  const bytesPerSample = 2 // 16-bit PCM
  const blockAlign = bytesPerSample
  const dataSize = length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true) // byte rate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, "data")
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, mono[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([buffer], { type: "audio/wav" })
}
