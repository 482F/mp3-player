const { readFile } = window.requires
const iF = window.infoFunctions
const JSON5 = window.JSON5

const infoKeys = ['files', 'lists', 'currentListIndex']

export default class Info {
  constructor() {}
  async export() {
    const info = JSON.parse(
      JSON.stringify(
        infoKeys
          .map((key) => ({ [key]: this[key] }))
          .reduce((all, part) => (all = { ...all, ...part }))
      )
    )
    return await iF.export(this.infoPath, info)
  }
  async import(infoPath) {
    this.infoPath = infoPath
    const info = JSON5.parse(await readFile(infoPath, 'utf-8'))
    for (const key of infoKeys) {
      this[key] = info[key]
    }
  }
  async getMusicInfo(filePath) {
    if (!this.files[filePath]) {
      this.files[filePath] = {
        name: path.basename(filePath).replace(/\.[^.]+/, ''),
      }
    }
    return {
      path: filePath,
      ...this.files[filePath],
    }
  }
}
