const info = window.info

export default class Info {
  constructor() {}
  async init() {
    const settings = await info.setSettingsIfNeededAndGet({
      volume: 1,
      currentListIndex: 0,
      loop: false,
    })
    Object.entries(settings).forEach(([key, value]) => {
      this[`_${key}`] = value
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
    info.setSettings({ loop: value })
  }

  get volume() {
    return this._volume
  }
  set volume(value) {
    this._volume
    info.setSettings({ volume: value })
  }

  get currentListIndex() {
    return this._currentListIndex
  }
  set currentListIndex(value) {
    this._currentListIndex = value
    info.setSettings({ currentListIndex: value })
  }
}
