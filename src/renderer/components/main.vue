<template>
  <div class="f-main">
    <player
      :music="current.music"
      :volume="volume"
      @update:volume="updateVolume"
    />
    <music-lists
      class="music-lists"
      :lists="info.lists"
      @update:lists="updateLists"
      @insert-musics="insertMusics"
      @open="open"
    />
  </div>
</template>

<script>
import CustomAudio from '@/renderer/classes/custom-audio.js'
import Info from '@/renderer/classes/info.js'
import MusicLists from './music-lists.vue'
import Player from './player.vue'

export default {
  name: 'main',
  components: {
    MusicLists,
    Player,
  },
  data() {
    return {
      info: {},
      currentMusic: null,
      volume: 1,
      current: {},
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
    async insertMusics(targetList, droppedFiles) {
      console.log({ targetList, droppedFiles })
      const allPaths = await this.$getAllPaths(
        droppedFiles.map((file) => file.path),
        ['mp3']
      )
      targetList.musics.push(
        ...(await Promise.all(
          allPaths.map((path) => this.info.getMusicInfo(path))
        ))
      )
      this.info.export()
    },
    updateLists(lists) {
      this.info.lists = lists
      this.info.export()
    },
    updateVolume(volume) {
      this.current.music.gain = this.volume = volume
    },
    async open(music, list, index) {
      this.current.list = list
      this.current.index = index
      this.current.music?.stop?.()
      this.current.music = await CustomAudio.construct(music.path, this.volume)
      this.current.music.start()
      this.current.music.onended = () => this.onended()
    },
    async onended() {
      await this.open(
        this.current.list.musics[
          this.current.index % this.current.list.musics.length
        ],
        this.current.list,
        this.current.index + 1
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.f-main {
  height: 100%;
  min-width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  .music-lists {
    flex-grow: 1;
  }
}
</style>
