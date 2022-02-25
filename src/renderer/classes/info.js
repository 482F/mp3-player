import Playlist from './playlist.js'

const info = window.info
const throttle = window.requires.throttle

export default class Info {
  constructor() {}
  async init() {
    const defaultSettings = {
      volume: 1,
      currentListIndex: 0,
      loop: false,
    }
    const settings = await info.settings.insertIfNeededAndGet(defaultSettings)
    Object.entries(settings).forEach(([key, value]) => {
      this[`_${key}`] = value

      const camelKey = `${key[0].toUpperCase()}${key.slice(1)}`
      this[`save${camelKey}`] = throttle((value) => {
        info.settings.set({ key: value })
      }, 1000)
    })
    this._playlists = await this.getAllPlaylists()
  }
  async insertPlaylists(names) {
    this._playlists.push(
      ...(await info.playlists.insert(names)).map((obj) => new Playlist(obj))
    )
  }
  async getAllPlaylists() {
    return (await info.playlists.getAll()).map((obj) => new Playlist(obj))
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

  get playlists() {
    return this._playlists
  }
}
