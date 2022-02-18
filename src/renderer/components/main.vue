<template>
  <div class="f-main">
    <music-list
      class="music-list"
      :musics="musics"
      @insert-musics="insertMusics"
    />
  </div>
</template>

<script>
import CustomAudio from '@/renderer/classes/custom-audio.js'
import Info from '@/renderer/classes/info.js'
import MusicList from './music-list.vue'

export default {
  name: 'main',
  components: {
    MusicList,
  },
  data() {
    return {
      musics: [],
      info: {},
    }
  },
  async mounted() {
    await this.initInfo()
    // const audio = new CustomAudio()
    // await audio.init(filePath)
    // audio.source.start(0)
  },
  methods: {
    async initInfo() {
      this.info = new Info()
      this.info.import('E:\\info.mp5')
    },
    async insertMusics(e) {
      const droppedFiles = [...e.dataTransfer.files] ?? []
      const allPaths = await this.$getAllPaths(
        droppedFiles.map((file) => file.path),
        ['mp3']
      )
      this.musics.push(
        ...(await Promise.all(
          allPaths.map((path) => this.info.getMusicInfo(path))
        ))
      )
      this.info.export()
    },
  },
}
</script>

<style lang="scss" scoped>
.f-main {
  min-height: 100%;
  min-width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  .music-list {
    flex-grow: 1;
    height: 100%;
    width: 100%;
  }
}
</style>
