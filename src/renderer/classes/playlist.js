import Music from './music.js'

const info = window.info

export default class Playlist {
  constructor({ id, name, isDisplay, displayIdx, playingIdx, musics }) {
    this._id = id
    this._name = name
    this._isDisplay = isDisplay
    this._displayIndex = displayIdx
    this._playingIndex = playingIdx
    this._musics = musics.map((music) => music ? new Music(this, music) : {})
  }

  async insertMusics(index, paths) {
    const musics = await info.playlists.insertMusic(this.id, index, paths)
    this._musics.push(
      ...(musics).map(
        (music) => new Music(this, music)
      )
    )
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
