const { readFile } = window.requires

export default class CustomAudio {
  constructor() {}
  static async construct(path) {
    const audio = new CustomAudio()
    await audio.init(path)
    return audio
  }
  async init(path) {
    this.file = await readFile(path)
    const buffer = this.file.buffer
    const audioCtx = new AudioContext()
    const audioBuffer = await new Promise((resolve) =>
      audioCtx.decodeAudioData(buffer, resolve)
    )
    this.source = audioCtx.createBufferSource()
    this.source.buffer = audioBuffer
    this.source.connect(audioCtx.destination)
  }
  start() {
    this.source.start()
  }
  stop() {
    this.source.stop()
  }
}
