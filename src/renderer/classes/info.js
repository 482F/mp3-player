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
    const settings = await info.settings.setIfNeededAndGet(defaultSettings)
    Object.entries(settings).forEach(([key, value]) => {
      this[`_${key}`] = value

      const camelKey = `${key[0].toUpperCase()}${key.slice(1)}`
      this[`save${camelKey}`] = throttle((value) => {
        info.settings.set({ key: value })
      }, 1000)
    })
    this.playlists = await info.getPlaylists()
  }
  async insertPlaylists(...values) {
    return await info.insertPlaylists(...values)
  }
  async getPlaylists() {
    this.playlists = await info.getPlaylists()
  }
  async getMusics(filePaths) {
    if (!this.files[filePath]) {
      this.files[filePath] = {
        name: path.basename(filePath).replace(/\.[^.]+/, ''),
      }
    }
    return {
      path: filePath,
      ...this.files[filePath],
    }
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
    this._volume
    this.saveVolume(value)
  }

  get currentListIndex() {
    return this._currentListIndex
  }
  set currentListIndex(value) {
    this._currentListIndex = value
    this.saveCurrentListIndex(value)
  }
}
