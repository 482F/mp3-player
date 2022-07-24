<template>
  <webview :src="src" ref="webview" :style="style" />
</template>

<script>
const resolves = {}

export default {
  name: 'custom-webview',
  data() {
    return {
      ready: false,
    }
  },
  props: {
    src: {
      type: String,
      default: '',
    },
    style: {
      type: [Object, String],
      default: '',
    },
  },
  watch: {
    src() {
      console.log('false')
      this.ready = false
    },
  },
  async mounted() {
    this.$refs.webview.addEventListener('console-message', (e) => {
      const pattern = /^mp3-player-(\d+-(0\.)?\d+)\s(.+)$/
      const { 1: id, 3: body } = e.message.match(pattern) ?? []
      if (e.level !== 2 || !id) {
        return
      }
      resolves[id](body === 'undefined' ? undefined : JSON.parse(body))
      delete resolves[id]
    })

    this.ready = true
    this.$refs.webview.addEventListener(
      'did-start-loading',
      () => ((this.ready = true), console.log('true'))
    )
  },
  methods: {
    async register(name, value, convertToJson = true) {
      while (!this.ready) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      this.$refs.webview.executeJavaScript(
        `${name} = ${convertToJson ? JSON.stringify(value) : value}`
      )
    },
    async run(func) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      while (!this.ready) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      console.log('run')
      const id = `${new Date().getTime()}-${Math.random()}`
      const promise = new Promise((resolve) => (resolves[id] = resolve))
      this.$refs.webview.executeJavaScript(
        `Promise.resolve(
          (${func.toString()})()
        )
          .catch((e) => { errorMessage: e.message })
          .then((r) => console.warn('mp3-player-${id}', JSON.stringify(r)))
      `
      )
      return await promise
    },
  },
}
</script>
