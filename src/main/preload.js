const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')

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
          if (
            !filterExts ||
            filterExts.includes(child.match(/\.([^.]+)$/)[1])
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

const infoFunctions = {
  async export(info, infoKeys) {
    const json = JSON.strinfigy(
      infoKeys
        .map((key) => ({ [key]: info[key] }))
        .reduce((all, part) => (all = { ...all, ...part }))
    )
    await writeFile(json, info.infoPath)
  },
}

const passObject = {
  requires: {
    listenIpc,
    sendIpc,
    readFile,
    getAllPaths,
  },
  infoFunctions,
  JSON5,
}

Object.entries(passObject).forEach(([apiKey, api]) =>
  contextBridge.exposeInMainWorld(apiKey, api)
)
