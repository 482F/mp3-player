<template>
  <div class="f-main" tabindex="0" @keydown="onKeydown">
    <player
      :music="current.music"
      :volume="info.volume ?? 1"
      :loop="info.loop ?? false"
      @update:volume="updateVolume"
      @update:loop="(value) => (info.loop = value)"
      @skip="skip"
      @shuffle="shuffle"
      @export="info.export()"
    />
    <div class="content">
      <music-lists
        ref="musicLists"
        class="music-lists"
        :lists="info.lists"
        v-model:current-list-index="info.currentListIndex"
        @update:lists="updateLists"
        @insert-musics="insertMusics"
        @open="open"
        @delete-item="deleteItem"
      />
      <lrc
        class="lrc"
        :key="current.music?.filePath"
        :music="current.music"
        v-model:editing="editing"
      />
    </div>
  </div>
</template>

<script>
import CustomAudio from '@/renderer/classes/custom-audio.js'
import Info from '@/renderer/classes/info.js'
import MusicLists from './music-lists.vue'
import Player from './player.vue'
import Lrc from './lrc/lrc.vue'

function shuffle(arr) {
  const rands = Array(arr.length)
    .fill(0)
    .map(() => Math.random())
  const randAndIndice = rands.map((rand, i) => [rand, i])
  const randIndice = randAndIndice
    .sort(([rand1], [rand2]) => rand1 - rand2)
    .map(([_, i]) => i)
  const result = []
  randIndice.forEach((index) => result.push(arr[index]))
  return result
}

export default {
  name: 'main',
  components: {
    MusicLists,
    Player,
    Lrc,
  },
  data() {
    return {
      info: {},
      currentMusic: null,
      current: {},
      editing: false,
    }
  },
  async mounted() {
    await this.initInfo()
  },
  methods: {
    onKeydown(e) {
      if (e.ctrlKey) {
        if (e.code === 'ArrowRight') {
          this.shiftMusicTime(3)
          e.preventDefault()
        } else if (e.code === 'ArrowLeft') {
          this.shiftMusicTime(-3)
          e.preventDefault()
        }
      }
    },
    shiftMusicTime(delta) {
      if (this.current.music) {
        this.current.music.currentTime = Math.max(
          this.current.music.currentTime + delta,
          0
        )
      }
    },
    deleteItem({ musics }, i) {
      musics.splice(i, 1)
    },
    shuffle() {
      this.$refs.musicLists.currentList.musics = shuffle(
        this.$refs.musicLists.currentList.musics
      )
      this.current.index = this.$refs.musicLists.currentList.musics.findIndex(
        (music) => music.isPlaying
      )
    },
    async skip(delta) {
      const nextIndex =
        (this.current.index + delta + this.current.list.musics.length) %
        this.current.list.musics.length
      await this.open(
        this.current.list.musics[nextIndex],
        this.current.list,
        nextIndex
      )
    },
    async initInfo() {
      this.info = new Info()
      this.info.import('E:\\info.mp5')
    },
    async insertMusics(targetList, droppedFiles) {
      console.log({ targetList, droppedFiles })
      const allPaths = await this.$getAllMusicPaths(
        droppedFiles.map((file) => file.path),
        ['mp3']
      )
      targetList.musics.push(
        ...(await Promise.all(
          allPaths.map((path) => this.info.getMusicInfo(path))
        ))
      )
    },
    updateLists(lists) {
      this.info.lists = lists
    },
    updateVolume(volume) {
      this.current.music.gain = this.info.volume = volume
    },
    async open(music, list, index) {
      const newMusic = await CustomAudio.construct(
        music.path,
        this.info.volume ?? 1
      )
      if (this.current.music) {
        this.current.music.stop()
        this.current.list.musics[this.current.index].isPlaying = false
      }
      this.current.list = list
      this.current.index = index
      list.musics[index].isPlaying = true
      this.current.music = newMusic
      this.current.music.start()
      this.current.music.onended = () => this.onended()
    },
    async onended() {
      if (this.info.loop || this.editing) {
        this.current.music.stop()
        this.current.music.start(0)
      } else {
        await this.skip(1)
      }
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
  .content {
    min-height: 0;
    flex-grow: 1;
    .music-lists {
      width: 600px;
      flex-shrink: 0;
    }
    .lrc {
      min-height: 0;
      flex-grow: 1;
      margin: 0 16px 16px;
    }
    display: flex;
  }
}
</style>
