<template>
  <div class="f-main">
    <player :music="currentMusic" />
    <music-list
      class="music-list"
      :musics="musics"
      @insert-musics="insertMusics"
      @open="open"
    />
  </div>
</template>

<script>
import CustomAudio from '@/renderer/classes/custom-audio.js'
import Info from '@/renderer/classes/info.js'
import MusicList from './music-list.vue'
import Player from './player.vue'

export default {
  name: 'main',
  components: {
    MusicList,
    Player,
  },
  data() {
    return {
      musics: [],
      info: {},
      currentMusic: null,
    }
  },
  async mounted() {
    await this.initInfo()
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
    async open(music, index) {
      this.currentIndex = index
      this.currentMusic?.stop?.()
      this.currentMusic = await CustomAudio.construct(music.path)
      this.currentMusic.start()
      this.currentMusic.onended = () => this.onended()
    },
    async onended() {
      this.currentIndex++
      await this.open(
        this.musics[this.currentIndex % this.musics.length],
        this.currentIndex
      )
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
