<template>
  <div class="f-main">abc</div>
</template>

<script>
export default {
  name: 'main',
  data() {
    return {}
  },
  methods: {},
  async mounted() {
    // const file = await this.$readFile(localFilePath)
    // const buffer = file.buffer
    // const audioCtx = new AudioContext()
    // audioCtx.decodeAudioData(buffer, (ab) => {
    //   const source = audioCtx.createBufferSource()
    //   source.buffer = ab
    //   source.connect(audioCtx.destination)
    //   source.start(0)
    // })
  },
}
</script>

<style lang="scss" scoped>
.f-main {
  min-height: 100%;
  min-width: 100%;
  background-color: #ffffff;
}
</style>
