import Music from './music.js'

const info = window.info

function shuffle(arr) {
  const rands = Array(arr.length)
    .fill(0)
    .map(() => Math.random())
  const randAndIndice = rands.map((rand, i) => [rand, i])
  const randIndice = randAndIndice
    .sort(([rand1], [rand2]) => rand1 - rand2)
    .map(([_, i]) => i)
  const result = []
  randIndice.forEach((index) => result.push(arr[index]))
  return result
}

export default class Playlist {
  constructor(index, { id, name, isDisplay, displayIdx, playingIdx, musics }) {
    this.index = index
    this._id = id
    this._name = name
    this._isDisplay = isDisplay
    this._displayIndex = displayIdx
    this._playingIndex = playingIdx
    this._musics = musics.map((music, i) =>
      music ? new Music(this, i, music) : {}
    )
  }

  async shuffle() {
    this._musics = shuffle(this.musics)
    const oldIndice = this.musics.map((music) => music.index)
    this.recalcIndice()
    await info.playlists.moveMusics(
      this.id,
      oldIndice,
      Array(this.musics.length)
        .fill(0)
        .map((_, i) => i)
    )
  }

  recalcIndice() {
    this.musics.forEach((music, i) => (music.index = i))
  }

  async insertMusics(index, paths) {
    const musics = (
      await info.playlists.insertAllByPaths(this.id, index, paths)
    ).map((music, i) => new Music(this, this._musics.length + i, music))
    this._musics.splice(index, 0, ...musics)
    this.recalcIndice()
  }

  async removeMusic(index) {
    this._musics.splice(index, 1)
    this.recalcIndice()
    await info.playlists.removeMusic(this.id, index)
  }

  async moveMusic(oldIndex, newIndex) {
    // vuedraggable で既に this.musics は変更されているので db と this.musics[i].index を変更する
    await info.playlists.moveMusic(this.id, oldIndex, newIndex)
    this.recalcIndice()
    this.playingIndex = this.musics.findIndex((music) => music.isPlaying)
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
