import Playlist from './playlist.js'

const info = window.info
const throttle = window.requires.throttle

export default class Info {
  constructor() {}
  async init() {
    this.current = {}

    const defaultSettings = {
      volume: 1,
      currentListIndex: 0,
      loop: false,
      leftWidth: 600,
      playing: false,
      autoScroll: true,
    }
    const settings = await info.settings.insertIfNeededAndGet(defaultSettings)
    Object.entries(settings).forEach(([key, value]) => {
      this[`_${key}`] = value

      const camelKey = `${key[0].toUpperCase()}${key.slice(1)}`
      this[`save${camelKey}`] = throttle((value) => {
        info.settings.set({ [key]: value })
      }, 1000)
    })
    this._playlists = await this.getAllPlaylists()
  }
  async insertPlaylists(names) {
    this._playlists.push(
      ...(await info.playlists.insert(names)).map(
        (obj, i) => new Playlist(this.playlists.length + i, obj)
      )
    )
  }
  async getAllPlaylists() {
    return (await info.playlists.getAll()).map((obj, i) => new Playlist(i, obj))
  }

  get loop() {
    return this._loop
  }
  set loop(value) {
    this._loop = value
    this.saveLoop(value)
  }

  get volume() {
    return this._volume
  }
  set volume(value) {
    this._volume = value
    this.saveVolume(value)
  }

  get currentListIndex() {
    return this._currentListIndex
  }
  set currentListIndex(value) {
    this._currentListIndex = value
    this.saveCurrentListIndex(value)
  }

  get leftWidth() {
    return this._leftWidth
  }
  set leftWidth(value) {
    this._leftWidth = value
    this.saveLeftWidth(value)
  }

  get playing() {
    return this._playing
  }
  set playing(value) {
    this._playing = value
    this.savePlaying(value)
  }

  get autoScroll() {
    return this._autoScroll
  }
  set autoScroll(value) {
    this._autoScroll = value
    this.saveAutoScroll(value)
  }

  get playlists() {
    return this._playlists
  }
}
