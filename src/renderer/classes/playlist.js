import Music from './music.js'

const info = window.info

export default class Playlist {
  constructor({ id, name, isDisplay, displayIdx, playingIdx, musics }) {
    this._id = id
    this._name = name
    this._isDisplay = isDisplay
    this._displayIdx = displayIdx
    this._playingIdx = playingIdx
    this._musics = musics.map((music) => new Music(music))
  }

  async insertMusics(idx, paths) {
    const musics = await info.playlists.insertMusic(this.id, idx, paths)
    this._musics.push(
      ...(musics).map(
        (music) => new Music(music)
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

  get displayIdx() {
    return this._displayIdx
  }

  get playingIdx() {
    return this._playingIdx
  }
  set playingIdx(value) {
    this._playingIdx = value
    info.playlists.updatePlayingIdx(this.id, value)
  }

  get musics() {
    return this._musics
  }
}
