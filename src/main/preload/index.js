const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')
const JSON5 = require('json5')
const info = require('./info.js')
const fs = require('./fs.js')
const throttle = require('lodash/throttle')
const { spawn } = require('child_process')

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

const infoFunctions = {
  async export(infoPath, info) {
    const json = JSON5.stringify(info, null, '  ')
    await fs.writeFile(infoPath, json)
  },
}

const openGoogleSearch = (query) => {
  if (query) {
    spawn('cmd.exe', [
      '/c',
      'start',
      `https://www.google.com/search?q=${query.replaceAll(' ', '+')}`,
    ])
  }
}

const passObject = {
  requires: {
    listenIpc,
    sendIpc,
    readFile: fs.readFile,
    throttle,
    openGoogleSearch,
  },
  infoFunctions,
  JSON5,
  path,
  info,
}

Object.entries(passObject).forEach(([apiKey, api]) =>
  contextBridge.exposeInMainWorld(apiKey, api)
)
