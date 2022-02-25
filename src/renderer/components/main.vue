<template>
  <div v-if="ready" class="f-main" tabindex="0" @keydown="onKeydown">
    <player
      :music="info.current.music"
      :volume="info.volume"
      v-model:loop="info.loop"
      @update:volume="updateVolume"
      @skip="skip"
      @shuffle="shuffle"
    />
    <div class="content">
      <music-lists
        ref="musicLists"
        class="music-lists"
        :lists="info.playlists"
        @open="open"
      />
      <lrc
        class="lrc"
        :key="info.current.music?.path"
        :music="info.current.music"
        v-model:editing="editing"
      />
    </div>
  </div>
</template>

<script>
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
      editing: false,
      ready: false,
    }
  },
  computed: {
    info() {
      return this.$store.state.info
    },
  },
  provide() {
    return {
      info: () => this.info,
    }
  },
  async mounted() {
    await this.initInfo()
    this.ready = true
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
      if (this.info.current.music) {
        this.info.current.music.currentTime = Math.max(
          this.info.current.music.currentTime + delta,
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
      this.info.current.index =
        this.$refs.musicLists.currentList.musics.findIndex(
          (music) => music.isPlaying
        )
    },
    async skip(delta) {
      const currentList = this.info.current.music.list
      const playingIndex = currentList.playingIndex
      const length = currentList.length
      const nextIndex = (playingIndex + delta + length) % length
      await this.open(currentList.musics[nextIndex])
    },
    async initInfo() {
      const info = new Info()
      await info.init()
      this.$store.dispatch('setInfo', info)
    },
    updateVolume(volume) {
      this.info.current.music.gain = this.info.volume = volume
    },
    async open(music) {
      if (this.info.current.music) {
        this.info.current.music.stop()
      }
      this.info.current.music = music
      await music.open(this.info.volume)
      // 他の曲が再生された場合
      if (this.info.current.music !== music) {
        return
      }
      this.info.current.music.start()
      this.info.current.music.onended = () => this.onended()
    },
    async onended() {
      if (this.info.loop || this.editing) {
        this.info.current.music.pause()
        this.info.current.music.start(0)
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
