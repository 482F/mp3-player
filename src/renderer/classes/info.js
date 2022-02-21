const { readFile } = window.requires
const iF = window.infoFunctions
const JSON5 = window.JSON5

const infoKeys = ['files']

export default class Info {
  constructor() {}
  async export(infoPath) {
    return await iF.export(this, infoPath)
  }
  async import(infoPath) {
    this.infoPath = infoPath
    const info = JSON5.parse(await readFile(infoPath, 'utf-8'))
    for (const key of infoKeys) {
      this[key] = info[key]
    }
  }
}
