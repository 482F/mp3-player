const fs = require('fs')

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

const extPattern = /\.([^.]+)$/

module.exports = {
  existsSync: fs.existsSync,
  readFile,
  writeFile,
  readdir,
  stat,
  extPattern,
}