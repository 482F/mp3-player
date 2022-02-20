const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')
const sqlite3 = require('sqlite3')

window.addEventListener('DOMContentLoaded', () => {
  //
  // ここに、レンダラープロセスに渡したい機能を記載していく
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

const sendIpc = async (listenerName, eventName, ...args) => {
  return JSON.parse(
    (await ipcRenderer.invoke(
      'sendIpc',
      JSON.stringify([`${listenerName}-${eventName}`, args])
    )) ?? null
  )
}
const listenIpc = async (listenerName, eventName, handler) => {
  ipcRenderer.on(`${listenerName}-${eventName}`, (_, args) =>
    handler(...JSON.parse(args))
  )
  await sendIpc('main', 'listen', listenerName, eventName)
}

const readFile = async (filePath, encoding) =>
  new Promise((resolve, reject) =>
    fs.readFile(filePath, encoding, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  )

const writeFile = async (filePath, data, options) =>
  new Promise((resolve, reject) =>
    fs.writeFile(filePath, data, options, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  )

const readdir = (path) =>
  new Promise((resolve, reject) =>
    fs.readdir(path, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  )

const stat = (path) =>
  new Promise((resolve, reject) =>
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err)
      } else {
        resolve(stats)
      }
    })
  )

/*
全部のファイルを読む必要は無い
- でも D&D されたディレクトリ以下のファイルは全部読めるようにしておくべき
D&D なりコマンドラインなりで渡されたファイルをアクティブなプレイリストに追加する
info.json5 で保持するのはプレイリストと追加された曲のメタデータ (評価、歌詞、etc...)
info.json5 に紐づけてプログラムが起動するようにしたいので info.mp5 とかにする？
*/

const extPattern = /\.([^.]+)$/

const getAllPaths = async (targetPaths, filterExts = null) => {
  const paths = []
  for (const targetPath of targetPaths) {
    if (await stat(targetPath).then((stats) => stats.isDirectory())) {
      const children = await readdir(targetPath)
      for (const child of children) {
        const absPath = path.join(targetPath, child)
        if (await stat(absPath).then((stats) => stats.isDirectory())) {
          paths.push(...(await getAllPaths(absPath, filterExts)))
        } else {
          if (!filterExts || filterExts.includes(child.match(extPattern)[1])) {
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
      const ext = path.match(extPattern)[1]
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
      const playlist = (await readFile(playlistPath, 'utf-8'))
        .replaceAll('\r', '')
        .split('\n')
        .filter((line) => !['#', undefined].includes(line[0]))
      musicPaths.push(...playlist)
    })
  )
  return musicPaths
}

const readLyric = async (musicPath) => {
  const lrcPath = musicPath.replace(extPattern, '.lrc')
  try {
    return await readFile(lrcPath, 'utf-8')
  } catch {
    return ''
  }
}

const writeLyric = async (musicPath, lyric) => {
  const lrcPath = musicPath.replace(extPattern, '.lrc')
  try {
    return await writeFile(lrcPath, lyric)
  } catch {
    return ''
  }
}

const infoFunctions = {
  async export(infoPath, info) {
    const json = JSON5.stringify(info, null, '  ')
    await writeFile(infoPath, json)
  },
}

const db = new sqlite3.Database('E:\\info.mp-sq3')
const dbExec = (name, ...args) => db[name](...args)

const passObject = {
  requires: {
    listenIpc,
    sendIpc,
    readFile,
    getAllMusicPaths,
    readLyric,
    writeLyric,
  },
  infoFunctions,
  JSON5,
  path,
  dbExec,
}

Object.entries(passObject).forEach(([apiKey, api]) =>
  contextBridge.exposeInMainWorld(apiKey, api)
)
