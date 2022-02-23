const { readFile } = window.requires
const path = window.path

export default class CustomAudio {
  constructor() {}
  static async construct(filePath, gain) {
    const audio = new CustomAudio()
    await audio.init(filePath, gain)
    console.log({ audio })
    return audio
  }
  async init(filePath, gain = 1) {
    this.filePath = filePath
    this.name = path.basename(filePath).replace(/\.[^.]+/, '')
    this.file = await readFile(filePath)
    const buffer = this.file.buffer
    this._audioCtx = new AudioContext()
    this._audioBuffer = await new Promise((resolve) =>
      this._audioCtx.decodeAudioData(buffer, resolve)
    )
    this._createSource()
    this.gain = gain
  }
  _createSource() {
    this._source = this._audioCtx.createBufferSource()
    this._source.buffer = this._audioBuffer
    this._gainNode = this._audioCtx.createGain()
    this._source.connect(this._gainNode)
    this._gainNode.connect(this._audioCtx.destination)
  }
  _interval() {
    this._currentTime = new Date().getTime() - this._startTime
    if (this.length <= this.currentTime) {
      this.stop()
      this.onended()
    }
  }
  start(offset) {
    offset = offset ? offset * 1000 : this._currentTime ?? 0 * 1000
    this._startTime = new Date().getTime() - offset
    this._intervalId = setInterval(() => this._interval(), 100)
    this._source.start(0, offset / 1000)
    this.isPlaying = true
  }
  stop() {
    if (this.isPlaying) {
      clearInterval(this._intervalId)
      this._intervalId = null
      this._source.stop()
      this._createSource()
      this.isPlaying = false
    }
  }

  get gain() {
    return this._gainNode.gain.value
  }
  set gain(value) {
    this._gainNode.gain.value = value
  }

  get currentTime() {
    return Math.floor((this._currentTime ?? 0) / 100) / 10
  }
  set currentTime(value) {
    this._currentTime = value * 1000
    if (this.isPlaying) {
      this.stop()
      this.start(value)
    }
  }

  get length() {
    return Math.ceil(this._audioBuffer.duration)
  }
}
