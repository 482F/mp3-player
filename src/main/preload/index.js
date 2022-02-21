const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')
const JSON5 = require('json5')
const info = require('./info.js')
const fs = require('./fs.js')
const throttle = require('lodash/throttle')

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


const getAllPaths = async (targetPaths, filterExts = null) => {
  const paths = []
  for (const targetPath of targetPaths) {
    if (await fs.stat(targetPath).then((stats) => stats.isDirectory())) {
      const children = await fs.readdir(targetPath)
      for (const child of children) {
        const absPath = path.join(targetPath, child)
        if (await fs.stat(absPath).then((stats) => stats.isDirectory())) {
          paths.push(...(await getAllPaths(absPath, filterExts)))
        } else {
          if (!filterExts || filterExts.includes(child.match(fs.extPattern)[1])) {
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
  return musicPaths
}

const infoFunctions = {
  async export(infoPath, info) {
    const json = JSON5.stringify(info, null, '  ')
    await fs.writeFile(infoPath, json)
  },
}

const passObject = {
  requires: {
    listenIpc,
    sendIpc,
    readFile: fs.readFile,
    getAllMusicPaths,
    throttle,
  },
  infoFunctions,
  JSON5,
  path,
  info,
}

Object.entries(passObject).forEach(([apiKey, api]) =>
  contextBridge.exposeInMainWorld(apiKey, api)
)
