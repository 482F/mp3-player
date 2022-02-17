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
  methods: {},
  async mounted() {
    // const audio = new CustomAudio()
    // await audio.init(filePath)
    // audio.source.start(0)
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
