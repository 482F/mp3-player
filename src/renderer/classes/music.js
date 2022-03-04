const { readFile } = window.requires
const info = window.info
const path = window.path

export default class Playlist {
  constructor(list, index, { id, path, length, title, artist, album, lyric }) {
    this.list = list
    this.index = index
    this._id = id
    this._path = path
    this._length = length / 1000
    this._title = title
    this._artist = artist
    this._album = album
    this._lyric = lyric
  }

  async open(gain = 1) {
    console.log('open')
    this.isPlaying = true
    this.list.playingIndex = this.index
    this._gain = gain
    this.file = await readFile(this.path)
    const buffer = this.file.buffer
    this._audioCtx = new AudioContext()
    this._audioBuffer = await this._audioCtx.decodeAudioData(buffer)
    if (!this._audioCtx) {
      this._releaseResources()
      return
    }
  }

  stop() {
    console.log('stop')
    this.pause()
    this._currentTime = 0
    this._releaseResources()
  }

  _releaseResources() {
    console.log('release')
    this.file = null
    if (this._audioCtx) {
      this._audioCtx.close().then(() => {
        this._audioCtx = null
      })
    }
    this._audioBuffer = null
    if (this._source) {
      this._source.disconnect()
      this._source.buffer = null
      this._source = null
    }
    if (this._gainNode) {
      this._gainNode.disconnect()
      this._gainNode = null
    }
    this.onended = null
  }

  _createSource() {
    this._source = this._audioCtx.createBufferSource()
    this._source.buffer = this._audioBuffer
    this._gainNode = this._audioCtx.createGain()
    this._source.connect(this._gainNode)
    this.gain = this._gain
    this._gainNode.connect(this._audioCtx.destination)
  }

  _interval() {
    console.log('interval')
    this._currentTime = new Date().getTime() - this._startTime
    if (this.length <= this.currentTime) {
      this.pause()
      this.onended?.()
    }
  }

  get gain() {
    return this._gain
  }
  set gain(value) {
    this._gain = value
    if (this._gainNode) {
      this._gainNode.gain.value = value
    }
  }

  get currentTime() {
    return Math.floor((this._currentTime ?? 0) / 10) / 100
  }
  set currentTime(value) {
    this._currentTime = value * 1000
    if (this.isPlaying) {
      this.pause()
      this.start(value)
    }
  }

  start(offset) {
    console.log('start')
    this._createSource()
    offset =
      offset !== undefined ? offset * 1000 : this._currentTime ?? 0 * 1000
    this._startTime = new Date().getTime() - offset
    this._intervalId = setInterval(() => this._interval(), 10)
    this._source.start(0, offset / 1000)
    this.isPlaying = true
  }
  pause() {
    console.log('pause')
    if (this.isPlaying) {
      clearInterval(this._intervalId)
      this._intervalId = null
      this.isPlaying = false
      this._source?.stop?.()
    }
  }

  get id() {
    return this._id
  }

  get path() {
    return this._path
  }

  get length() {
    return this._length
  }

  get title() {
    return this._title || path.basename(this.path)
  }

  get artist() {
    return this._artist
  }

  get album() {
    return this._album
  }

  get lyric() {
    return this._lyric
  }
  set lyric(value) {
    this._lyric = value
    info.musics.updateLyric(this.path, value)
  }
}
