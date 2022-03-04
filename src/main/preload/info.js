const id3 = require('node-id3')
const mp3Duration = require('mp3-duration')
const fs = require('./fs.js')
const path = require('path')

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

function repeatPlaceholder(placeholder, length, joint = ',') {
  return Array(length)
    .fill(0)
    .map(() => placeholder)
    .join(joint)
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

const getAllPaths = async (targetPaths, filterExts = null) => {
  const paths = []
  for (const targetPath of targetPaths) {
    if (await fs.stat(targetPath).then((stats) => stats.isDirectory())) {
      const children = await fs.readdir(targetPath)
      for (const child of children) {
        const absPath = path.join(targetPath, child)
        if (await fs.stat(absPath).then((stats) => stats.isDirectory())) {
          paths.push(...(await getAllPaths([absPath], filterExts)))
        } else {
          if (
            !filterExts ||
            filterExts.includes(child.match(fs.extPattern)[1])
          ) {
            paths.push(absPath)
          }
        }
      }
    } else {
      paths.push(targetPath)
    }
  }
  return paths
}

const getAllMusicPaths = async (targetPaths) => {
  const paths = await getAllPaths(targetPaths, ['mp3', 'm3u8'])
  const { music: musicPaths, playlist: playlistPaths } = paths.reduce(
    (all, path) => {
      const ext = path.match(fs.extPattern)[1]
      if (['mp3'].includes(ext)) {
        all.music.push(path)
      } else if (['m3u8'].includes(ext)) {
        all.playlist.push(path)
      }
      return all
    },
    { music: [], playlist: [] }
  )
  await Promise.all(
    playlistPaths.map(async (playlistPath) => {
      const playlist = (await fs.readFile(playlistPath, 'utf-8'))
        .replaceAll('\r', '')
        .split('\n')
        .filter((line) => !['#', undefined].includes(line[0]))
      musicPaths.push(...playlist)
    })
  )
  return musicPaths.filter(fs.existsSync)
}

const db = createDbProxy('E:\\info.mp-sq3')

;(async function () {
  await db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER UNIQUE NOT NULL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
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
    idx         INTEGER        NOT NULL              ,
    playlist_id INTEGER        NOT NULL              ,
    music_id    INTEGER        NOT NULL              ,
    UNIQUE(idx, playlist_id)                         ,
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

info.settings = {}

info.settings.set = async (obj) => {
  if (!Object.keys(obj).length) {
    return
  }
  Object.entries(obj).forEach(([key, value]) =>
    db.run(`UPDATE settings SET value = ? WHERE key = ?`, value.toString(), key)
  )
}

info.settings.insert = async (obj) => {
  if (!Object.keys(obj).length) {
    return
  }
  const values = Object.entries(obj).map(([key, value]) => [
    key,
    value.toString(),
  ])
  return await db.run(
    `INSERT INTO settings (
      key,
      value
    ) VALUES ${repeatPlaceholder('(?, ?)', values.length)}`,
    ...values.flat()
  )
}

info.settings.get = async () => {
  return await db.all(`SELECT * FROM settings`).then((result) =>
    result
      .map(({ key, value }) => {
        const converters = {
          volume: Number,
          currentListIndex: Number,
          loop: (v) => v === 'true',
          leftWidth: Number,
          playing: (v) => v === 'true',
        }
        return { [key]: (converters[key] ?? ((v) => v))(value) }
      })
      .reduce((all, part) => ({ ...all, ...part }), {})
  )
}

info.settings.insertIfNeededAndGet = async (obj) => {
  const clonedObj = { ...obj }
  const settings = await info.settings.get()
  Object.entries(clonedObj).forEach(([key, value]) => {
    if (settings[key] === undefined) {
      return
    }
    delete clonedObj[key]
  })
  await info.settings.insert(clonedObj)
  return {
    ...settings,
    ...clonedObj,
  }
}

info.musics = {}

info.musics.getByIds = async (ids) => {
  const musics = await db.all(
    `SELECT * FROM musics WHERE id IN (${repeatPlaceholder('?', ids.length)})`,
    ...ids
  )
  const musicDict = {}
  for (const music of musics) {
    musicDict[music.id] = music
  }
  return ids.map((id) => musicDict[id])
}

info.playlists = {}

info.playlists.insert = async (names) => {
  let count = (await db.get(`SELECT COUNT(*) FROM playlists`))['COUNT(*)']
  count = isNaN(count) ? 0 : count
  const values = names.map((name) => [name, true, count++])
  await db.run(
    `INSERT INTO playlists (
      name,
      is_display,
      display_idx
    ) VALUES ${repeatPlaceholder('(?, ?, ?)', names.length)}`,
    ...values.flat()
  )
  const playlists = await db.all(
    `SELECT * FROM playlists WHERE name IN (${repeatPlaceholder(
      '?',
      names.length
    )})`,
    ...names
  )
  const playlistDict = {}
  for (const playlist of playlists) {
    playlistDict[playlist.name] = playlist
  }

  return values.map((value) => ({
    id: playlistDict[value[0]].id,
    name: value[0],
    isDisplay: true,
    displayIdx: value[1],
    playingIdx: 0,
    musics: [],
  }))
}

info.playlists.getAll = async () => {
  return await Promise.all(
    (await db.all(`SELECT * FROM playlists`))
      .map(snakeKeyToCamel)
      .map(async (playlist) => {
        playlist.isDisplay = Boolean(playlist.isDisplay)
        const musicIds = (
          await db.all(
            `SELECT music_id FROM playlists_musics
            WHERE playlist_id = ?
            ORDER BY idx ASC`,
            playlist.id
          )
        ).map((row) => row.music_id)
        playlist.musics = await info.musics.getByIds(musicIds)
        return playlist
      })
  )
}

info.playlists.insertMusicsByIds = async (playlistId, idx, ids) => {
  // TODO: 普通に update すると unique 制約に引っかかるので、
  // 一旦負のインデックスを設定して後で正のインデックスに直している
  // N+1 とどちらが良いんだろうか・・・
  await db.run(
    `UPDATE playlists_musics SET idx = -1 * (idx + ?)
      WHERE playlist_id = ?
        AND ? <= idx`,
    ids.length,
    playlistId,
    idx
  )
  await db.run(
    `UPDATE playlists_musics SET idx = -1 * idx
      WHERE playlist_id = ?
        AND idx < 0`,
    playlistId
  )
  const values = ids.map((id) => [idx++, playlistId, id])
  await db.run(
    `INSERT INTO playlists_musics (
    idx,
    playlist_id,
    music_id
  ) VALUES ${repeatPlaceholder('(?, ?, ?)', ids.length)}`,
    ...values.flat()
  )
}

info.playlists.insertMusicsByPaths = async (playlistId, idx, paths) => {
  const musics = await info.musics.insertIfNeededAndGet(paths)
  await info.playlists.insertMusicsByIds(
    playlistId,
    idx,
    musics.map(({ id }) => id)
  )
  return musics
}

info.playlists.insertAllByPaths = async (playlistId, idx, paths) => {
  const expandedPaths = await getAllMusicPaths(paths)
  return info.playlists.insertMusicsByPaths(playlistId, idx, expandedPaths)
}

// TODO: 単一の項目に関してのみ呼び出しができるため N+1 になりうる
info.playlists.removeMusic = async (playlistId, idx) => {
  await db.run(
    `DELETE FROM playlists_musics
    WHERE playlist_id = ?
      AND idx = ?`,
    playlistId,
    idx
  )
  await db.run(
    `UPDATE playlists_musics SET idx = -1 * (idx - 1)
      WHERE playlist_id = ?
        AND ? <= idx`,
    playlistId,
    idx
  )
  await db.run(
    `UPDATE playlists_musics SET idx = -1 * idx
      WHERE playlist_id = ?
        AND idx < 0`,
    playlistId
  )
}

// TODO: N+1
info.playlists.moveMusics = async (playlistId, oldIndice, newIndice) => {
  if (oldIndice.length !== newIndice.length) {
    throw new Error('oldIndice.length !== newIndice.length')
  }
  const indicePairs = []
  for (let i = 0; i < oldIndice.length; i++) {
    indicePairs.push([oldIndice[i], -newIndice[i]])
  }
  const toZeroIndice = indicePairs.find(([, newIdx]) => newIdx === 0)
  const filteredIndicePairs = indicePairs.filter(([, newIdx]) => newIdx !== 0)
  const filteredOldIndice = oldIndice.filter(
    (oldIdx) => oldIdx !== toZeroIndice[0]
  )
  const length = filteredIndicePairs.length
  // SET idx = 0 だけは unique 制約に違反する可能性があるため後で処理する
  await db.run(
    `UPDATE playlists_musics SET idx =
      CASE idx
        ${repeatPlaceholder('WHEN ? THEN ?', length, ' ')}
      END
      WHERE playlist_id = ?
        AND idx IN (${repeatPlaceholder('?', length)})`,
    ...filteredIndicePairs.flat(),
    playlistId,
    ...filteredOldIndice
  )
  if (toZeroIndice) {
    await db.run(
      `UPDATE playlists_musics SET idx = 0
      WHERE playlist_id = ?
        AND idx = ?`,
      playlistId,
      toZeroIndice[0]
    )
  }
  await db.run(
    `UPDATE playlists_musics SET idx = -1 * idx
      WHERE playlist_id = ?
        AND idx < 0`,
    playlistId
  )
}

// TODO: 単一の項目に関してのみ呼び出しができるため N+1 になりうる
info.playlists.moveMusic = async (playlistId, oldIdx, newIdx) => {
  if (oldIdx === newIdx) {
    return
  }

  const musicId = (
    await db.get(
      `SELECT music_id FROM playlists_musics
      WHERE playlist_id = ?
        AND idx = ?`,
      playlistId,
      oldIdx
    )
  ).music_id
  await info.playlists.removeMusic(playlistId, oldIdx)
  await info.playlists.insertMusicsByIds(playlistId, newIdx, [musicId])
}

info.playlists.updateName = async (playlistId, value) => {
  await db.run(`UPDATE playlists SET name = ? WHERE id = ?`, value, playlistId)
}

info.playlists.updateIsDisplay = async (playlistId, value) => {
  await db.run(
    `UPDATE playlists SET is_display = ? WHERE id = ?`,
    value ? 1 : 0,
    playlistId
  )
}

info.playlists.updatePlayingIdx = async (playlistId, value) => {
  await db.run(
    `UPDATE playlists SET playing_idx = ? WHERE id = ?`,
    value,
    playlistId
  )
}

info.musics.insert = async (paths) => {
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
    `INSERT INTO musics (
      path,
      length,
      title,
      artist,
      album,
      lyric
    ) VALUES ${repeatPlaceholder('(?, ?, ?, ?, ?, ?)', paths.length)}`,
    ...values.flat()
  )

  const musics = await db.all(
    `SELECT * FROM musics WHERE path IN (${repeatPlaceholder(
      '?',
      values.length
    )})`,
    ...values.map(([path]) => path)
  )
  const musicDict = {}
  for (const music of musics) {
    musicDict[music.path] = music
  }
  return values.map((value) => ({
    id: musicDict[value[0]].id,
    path: value[0],
    length: value[1],
    title: value[2],
    artist: value[3],
    album: value[4],
    lyric: value[5],
  }))
}

info.musics.insertIfNeededAndGet = async (paths) => {
  const existsPaths = paths.filter(fs.existsSync)
  const musics = await db.all(
    `SELECT * FROM musics WHERE path IN (${repeatPlaceholder(
      '?',
      existsPaths.length
    )})`,
    ...existsPaths
  )
  const musicDict = {}
  for (const music of musics) {
    musicDict[music.path] = music
  }
  const pathAndMusics = existsPaths.map((p) => [p, musicDict[p]])
  const unregisteredUniquePaths = [
    ...new Set(
      pathAndMusics.filter(([_, music]) => !music).map(([path]) => path)
    ),
  ]
  if (unregisteredUniquePaths.length) {
    const maxLength = 100
    const newMusics = []
    for (let i = 0; i < unregisteredUniquePaths.length / maxLength; i++) {
      newMusics.push(
        ...(await info.musics.insert(
          unregisteredUniquePaths.slice(i * maxLength, (i + 1) * maxLength)
        ))
      )
    }
    for (const music of newMusics) {
      musicDict[music.path] = music
    }
  }
  return pathAndMusics.map(([p, music]) => music ?? musicDict[p])
}

info.musics.updateLyric = async (path, lyric) => {
  await Promise.all([
    writeLyric(path, lyric),
    db.run(`UPDATE musics SET lyric = ? WHERE path = ?`, lyric, path),
  ])
}

module.exports = info
