const { getAudio } = window.requires

export default class CustomAudio {
  constructor() {}
  async init(path) {
    this.file = await getAudio(path)
    const buffer = this.file.buffer
    const audioCtx = new AudioContext()
    const audioBuffer = await new Promise((resolve) =>
      audioCtx.decodeAudioData(buffer, resolve)
    )
    this.source = audioCtx.createBufferSource()
    this.source.buffer = audioBuffer
    this.source.connect(audioCtx.destination)
  }
}
