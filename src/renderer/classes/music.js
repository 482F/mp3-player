const info = window.info
const path = window.path

export default class Playlist {
  constructor({ id, path, length, title, artist, album, lyric }) {
    this._id = id
    this._path = path
    this._lenght = length
    this._title = title
    this._artist = artist
    this._album = album
    this._lyric = lyric
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
    return this.musics.updateLyric(value)
  }
}
