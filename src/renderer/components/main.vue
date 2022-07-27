<template>
  <div v-if="ready" ref="main" class="f-main" tabindex="0" @keydown="onKeydown">
    <player
      ref="player"
      :music="info.current.music"
      :volume="info.volume"
      v-model:loop="info.loop"
      @update:volume="updateVolume"
      @skip="skip"
      @shuffle="shuffle"
      @open="open"
    />
    <div class="content">
      <music-lists
        ref="musicLists"
        class="music-lists"
        :style="{ width: (info.leftWidth ?? 600) + 'px' }"
        :lists="info.playlists"
        @open="open"
      />
      <div class="resizer" @mousedown.left="resizeStart" />
      <lrc class="lrc" :music="info.current.music" v-model:editing="editing" />
    </div>
  </div>
</template>

<script>
import Info from '@/renderer/classes/info.js'
import MusicLists from './music-lists.vue'
import Player from './player.vue'
import Lrc from './lrc/lrc.vue'

let playCount = 0

export default {
  name: 'main',
  components: {
    MusicLists,
    Player,
    Lrc,
  },
  data() {
    return {
      openSymbol: null,
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
    if (this.info.playing) {
      this.open()
    }
    await this.$nextTick()
    this.$refs.main.focus()
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
      if (
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes(e.target.tagName)
      ) {
        const player = this.$refs.player
        if (player.music?.isPlaying) {
          player.music.pause()
        } else {
          player.start()
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
    async shuffle() {
      await this.info.playlists[this.info.currentListIndex].shuffle()
    },
    async skip(delta, reload = true) {
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
      this.info.playing = true
      if (!music) {
        const currentList = this.info.playlists[this.info.currentListIndex]
        music = currentList.musics[currentList.playingIndex]
      }
      if (this.info.current.music) {
        this.info.current.music.stop()
      }
      this.info.current.music = music
      const openSymbol = (this.openSymbol = Symbol())
      await music.open(this.info.volume)
      // 他の曲が再生された場合
      if (this.openSymbol !== openSymbol) {
        return
      }
      this.info.current.music.start(0)
      this.info.current.music.onended = () => this.onended()
      playCount++
      if (10 <= playCount) {
        this.$sendIpc('main', 'rerun')
      }
    },
    async onended() {
      if (this.info.loop || this.editing) {
        this.info.current.music.pause()
        this.info.current.music.start(0)
      } else {
        await this.skip(1)
      }
    },
    resizeStart(e) {
      const initLeftWidth = this.info.leftWidth
      const start = e.clientX
      const resizing = (e) => {
        const delta = e.clientX - start
        this.info.leftWidth = initLeftWidth + delta
      }
      const resizeEnd = () => {
        document.removeEventListener('mousemove', resizing)
        document.removeEventListener('mouseup', resizeEnd)
      }
      document.addEventListener('mousemove', resizing)
      document.addEventListener('mouseup', resizeEnd)
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
    display: flex;
    .music-lists {
      flex-shrink: 0;
    }
    .resizer {
      width: 8px;
      cursor: ew-resize;
    }
    .lrc {
      min-height: 0;
      flex-grow: 1;
      margin: 16px;
    }
  }
}
</style>

<style lang="scss">
.v-icon {
  &.large {
    font-size: 3rem;
  }
  &.normal {
    font-size: 2rem;
  }
}
</style>
