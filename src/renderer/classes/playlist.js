import Music from './music.js'

const info = window.info

export default class Playlist {
  constructor({ id, name, isDisplay, displayIdx, playingIdx, musics }) {
    this._id = id
    this._name = name
    this._isDisplay = isDisplay
    this._displayIndex = displayIdx
    this._playingIndex = playingIdx
    this._musics = musics.map((music, i) =>
      music ? new Music(this, i, music) : {}
    )
  }

  async insertMusics(index, paths) {
    const musics = (
      await info.playlists.insertMusicsByPaths(this.id, index, paths)
    ).map((music, i) => new Music(this, this._musics.length + i, music))
    this._musics.splice(index, 0, ...musics)
  }

  async moveMusic(oldIndex, newIndex) {
    // vuedraggable で既に this.musics は変更されているので db と this.musics[i].index を変更する
    this.musics.forEach((music, i) => (music.index = i))
    await info.playlists.moveMusic(this.id, oldIndex, newIndex)
  }

  get id() {
    return this._id
  }

  get name() {
    return this._name
  }
  set name(value) {
    this._name = value
    info.playlists.updateName(this.id, value)
  }

  get isDisplay() {
    return this._isDisplay
  }
  set isDisplay(value) {
    this._isDisplay = value
    info.playlists.updateIsDisplay(this.id, value)
  }

  get displayIndex() {
    return this._displayIndex
  }

  get playingIndex() {
    return this._playingIndex
  }
  set playingIndex(value) {
    this._playingIndex = value
    info.playlists.updatePlayingIdx(this.id, value)
  }

  get musics() {
    return this._musics
  }

  get length() {
    return this._musics.length
  }
}
