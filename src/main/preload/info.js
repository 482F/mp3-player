const id3 = require('node-id3')
const mp3Duration = require('mp3-duration')
const fs = require('./fs.js')

function snakeKeyToCamel(obj) {
  const newObj = {}
  Object.keys(obj).forEach((snakeKey) => {
    const camelKey = snakeKey.replace(/_./g, function (s) {
      return s.charAt(1).toUpperCase()
    })
    newObj[camelKey] = obj[snakeKey]
  })
  return newObj
}

function toAsyncCallback(func) {
  return new Promise((resolve, reject) => {
    func((err, result) => {
      if (err) reject(err)
      resolve(result)
    })
  })
}

function createDbProxy(dbFilePath) {
  const sqlite3 = require('sqlite3')
  return new Proxy(new sqlite3.Database(dbFilePath), {
    get: function (db, key, receiver) {
      if (['run', 'get', 'all'].includes(key)) {
        return async (sql, ...params) =>
          await toAsyncCallback((c) => db[key](sql, ...params, c))
      } else {
        return (...args) => db[key](...args)
      }
    },
  })
}

function repeatPlaceholder(placeholder, length) {
  return Array(length)
    .fill(0)
    .map(() => placeholder)
    .join(',')
}

const readLyric = async (musicPath) => {
  const lrcPath = musicPath.replace(fs.extPattern, '.lrc')
  try {
    return await fs.readFile(lrcPath, 'utf-8')
  } catch {
    return ''
  }
}

const writeLyric = async (musicPath, lyric) => {
  const lrcPath = musicPath.replace(fs.extPattern, '.lrc')
  try {
    return await fs.writeFile(lrcPath, lyric)
  } catch {
    return ''
  }
}

const db = createDbProxy('E:\\info.mp-sq3')

;(async function () {
  await db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER UNIQUE NOT NULL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT UNIQUE NOT NULL
  );`)
  await db.run(`
  CREATE TABLE IF NOT EXISTS musics (
    id     INTEGER UNIQUE NOT NULL PRIMARY KEY           ,
    path   TEXT    UNIQUE NOT NULL                       ,
    length INTEGER        NOT NULL                       ,
    title  TEXT           NOT NULL             DEFAULT '',
    artist TEXT           NOT NULL             DEFAULT '',
    album  TEXT           NOT NULL             DEFAULT '',
    lyric  TEXT           NOT NULL             DEFAULT '',
    rating INTEGER        NOT NULL             DEFAULT 0 ,
    count  INTEGER        NOT NULL             DEFAULT 0
  );`)
  await db.run(`
  CREATE TABLE IF NOT EXISTS playlists (
    id            INTEGER UNIQUE NOT NULL PRIMARY KEY          ,
    name          TEXT    UNIQUE NOT NULL                      ,
    is_display    INTEGER        NOT NULL             DEFAULT 1,
    display_idx   INTEGER UNIQUE NOT NULL                      ,
    playing_idx   INTEGER
  );`)
  await db.run(`
  CREATE TABLE IF NOT EXISTS playlists_musics (
    id          INTEGER UNIQUE NOT NULL PRIMARY KEY  ,
    idx         INTEGER        NOT NULL              ,
    playlist_id INTEGER        NOT NULL              ,
    music_id    INTEGER        NOT NULL              ,
    UNIQUE(idx, playlist_id, music_id)               ,
    FOREIGN KEY(playlist_id) REFERENCES playlists(id),
    FOREIGN KEY(music_id) REFERENCES musics(id)
  );`)
  await db.run(`
  CREATE TABLE IF NOT EXISTS queue (
    id       INTEGER UNIQUE NOT NULL PRIMARY KEY,
    idx      INTEGER UNIQUE NOT NULL            ,
    music_id INTEGER        NOT NULL            ,
    FOREIGN KEY(music_id) REFERENCES musics(id)
  );`)
})()

const info = {}

// TODO: paths の中に db にあるものがないか、存在しないファイルがないかチェックする必要がある
info.addMusics = async (paths) => {
  const values = await Promise.all(
    paths.map(async (path) => {
      const [tags, lyric, length] = await Promise.all([
        toAsyncCallback((c) => id3.read(path, c)),
        readLyric(path),
        toAsyncCallback((c) => mp3Duration(path, c)),
      ])
      return [
        path,
        Math.round(length * 1000),
        tags.title ?? '',
        tags.artist ?? '',
        tags.album ?? '',
        lyric ?? '',
      ]
    })
  )
  await db.run(
    `INSERT OR IGNORE INTO musics (
      path,
      length,
      title,
      artist,
      album,
      lyric
    ) VALUES ${repeatPlaceholder('(?, ?, ?, ?, ?, ?)', paths.length)}`,
    ...values.flat()
  )
}

info.setSettings = async (obj) => {
  if (!Object.keys(obj).length) {
    return
  }
  Object.entries(obj).forEach(([key, value]) =>
    db.run(`UPDATE settings SET value = ? WHERE key = ?`, value.toString(), key)
  )
}

info.insertSettings = async (obj) => {
  if (!Object.keys(obj).length) {
    return
  }
  const values = Object.entries(obj).map(([key, value]) => [
    key,
    value.toString(),
  ])
  return await db.run(
    `INSERT OR IGNORE INTO settings (
      key,
      value
    ) VALUES ${repeatPlaceholder('(?, ?)', values.length)}`,
    ...values.flat()
  )
}

info.getSettings = async () => {
  return await db.all(`SELECT * FROM settings`).then((result) =>
    result
      .map(({ key, value }) => {
        const converters = {
          volume: Number,
          currentListIndex: Number,
          loop: (v) => v === 'true',
        }
        return { [key]: (converters[key] ?? ((v) => v))(value) }
      })
      .reduce((all, part) => ({ ...all, ...part }), {})
  )
}

info.setSettingsIfNeededAndGet = async (obj) => {
  const clonedObj = { ...obj }
  const settings = await info.getSettings()
  Object.entries(clonedObj).forEach(([key, value]) => {
    if (settings[key] === undefined) {
      return
    }
    delete clonedObj[key]
  })
  await info.insertSettings(clonedObj)
  return {
    ...settings,
    ...clonedObj,
  }
}

info.insertPlaylists = async (...values) => {
  return await db.run(
    `INSERT OR IGNORE INTO playlists (
      name,
      display_idx
    ) VALUES ${repeatPlaceholder('(?, ?)', values.length)}`,
    ...values.flat()
  )
}

info.getPlaylists = async () => {
  return await Promise.all(
    (await db.all(`SELECT * FROM playlists`))
      .map(snakeKeyToCamel)
      .map(async (playlist) => {
        playlist.isDisplay = Boolean(playlist.isDisplay)
        // const musicIds = await db.all(
        //   `SELECT * FROM playlists_musics
        //     WHERE playlist_id = ?
        //     ORDER BY idx ASC`,
        //   playlist.id
        // )

        // console.log(musicIds)
        return playlist
      })
  )
}

module.exports = info
