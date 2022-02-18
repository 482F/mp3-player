const requires = window.requires

export default {
  install(app) {
    for (const [name, func] of Object.entries(requires)) {
      app.config.globalProperties['$' + name] = func
    }
    app.config.globalProperties.$console = console
  },
}
