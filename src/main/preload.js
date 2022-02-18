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
  new Promise((resolve) =>
    fs.readFile(filePath, encoding, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  )

const writeFile = async (filePath, data, options) =>
  new Promise((resolve) =>
    fs.writeFile(filePath, data, options, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  )

const findInfoFilePath = (targetDirPath) => {
  const infoPath = path.join(targetDirPath, 'info.json5')
  if (fs.existsSync(infoPath)) {
    return infoPath
  }
  const nextTargetDirPath = path.dirname(targetDirPath)
  if (nextTargetDirPath === targetDirPath) {
    return null
  } else {
    findInfoFilePath(nextTargetDirPath)
  }
}

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

const getAllFilePaths = async (targetDirPath, filterExts = null) => {
  const children = await readdir(targetDirPath)
  const paths = []
  for (const child of children) {
    const absPath = path.join(targetDirPath, child)
    if (await stat(absPath).then((stats) => stats.isDirectory())) {
      paths.push(...(await getAllFilePaths(absPath, filterExts)))
    } else {
      if (!filterExts || filterExts.includes(child.match(/\.([^.]+)$/)[1])) {
        paths.push(absPath)
      }
    }
  }
  return paths
}

const getInfo = async (targetDirPath) => {
  let infoPath = findInfoFilePath(targetDirPath)
  if (!infoPath) {
    infoPath = path.join(targetDirPath, 'info.json5')
    writeFile(infoPath, '{}')
  }
  const info = JSON5.parse(await readFile(infoPath))
  return info
}

contextBridge.exposeInMainWorld('requires', {
  listenIpc,
  sendIpc,
  readFile,
  getInfo,
})
