<template>
  <div class="f-main">abc</div>
</template>

<script>
import CustomAudio from '@/renderer/classes/custom-audio.js'
export default {
  name: 'main',
  data() {
    return {}
  },
  async mounted() {
    await this.initInfo()
    // const audio = new CustomAudio()
    // await audio.init(filePath)
    // audio.source.start(0)
  },
  methods: {
    async initInfo() {
      const [lastDir] = (await this.$sendIpc(
        'main',
        'getStore',
        'lastDir'
      )) ?? ['']
      const info = await this.$getInfo(lastDir)
    },
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
