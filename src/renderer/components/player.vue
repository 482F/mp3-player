<template>
  <div
    class="f-player"
    @mousedown.middle.prevent="music?.isPlaying ? music.pause() : start()"
  >
    <div class="info">
      <div v-if="music">
        <div class="name">{{ music.title }}</div>
        <div class="between">
          <div class="right">{{ music.artist || '[no artist]' }}</div>
          <div class="center">-</div>
          <div class="left">{{ music.album || '[no album]' }}</div>
        </div>
        <div>
          {{ $formatTime(music.currentTime) }} / {{ $formatTime(music.length) }}
        </div>
      </div>
    </div>
    <div class="control">
      <div class="between">
        <div class="left">
          <div class="slider-wrapper">
            <input
              class="slider"
              type="range"
              :max="1000"
              :value="volume * 100"
              @input="
                (e) => $emit('update:volume', e.target.valueAsNumber / 100)
              "
            />
          </div>
        </div>
        <div class="center">
          <v-icon class="normal" @click="$emit('skip', -1)"
            >mdi-skip-previous</v-icon
          >
          <v-icon class="large" @click="stop" size="x-large"> mdi-stop </v-icon>
          <v-icon class="large" v-show="!music?.isPlaying" @click="start">
            mdi-play
          </v-icon>
          <v-icon
            class="large"
            v-show="music?.isPlaying"
            @click="music.pause()"
          >
            mdi-pause
          </v-icon>
          <v-icon class="normal" @click="$emit('skip', 1)"
            >mdi-skip-next</v-icon
          >
        </div>
        <div class="right">
          <v-icon
            @click="$emit('update:loop', !loop)"
            :color="loop ? 'black' : '#ccc'"
          >
            mdi-sync
          </v-icon>
          <v-icon @click="$emit('shuffle')">mdi-shuffle</v-icon>
        </div>
      </div>
      <input
        class="slider"
        :style="{ '--height': '24px' }"
        type="range"
        :max="(music?.length ?? 0) * 10"
        :value="(music?.currentTime ?? 0) * 10"
        @input="(e) => setTime(e.target.valueAsNumber / 10)"
      />
    </div>
  </div>
</template>

<script>
import Music from '@/renderer/classes/music.js'

export default {
  name: 'player',
  data() {
    return {}
  },
  props: {
    music: {
      type: Music,
      default: null,
    },
    volume: {
      type: Number,
      default: 1,
    },
    loop: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    info() {
      return this.$store.state.info
    },
  },
  mounted() {},
  methods: {
    stop() {
      this.info.current.music.stop()
      this.info.current.music = null
    },
    async start() {
      if (this.music) {
        this.music.start()
      } else {
        const currentList = this.info.playlists[this.info.currentListIndex]
        this.$emit('open', currentList.musics[currentList.playingIndex])
      }
    },
    setTime(time) {
      if (this.music) {
        this.music.currentTime = time
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.f-player {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  .info {
    height: 100px;
    width: 100%;
    padding-top: 4px;
    .name {
      font-size: 24px;
    }
    > * {
      text-align: center;
    }
  }
  .slider {
    --height: 6px;
    appearance: none;
    background: lightgray;
    height: var(--height);
    width: 100%;
    outline: 0;
    overflow: hidden;
    &::-webkit-slider-thumb {
      -webkit-appearance: none; // デフォルトのつまみのスタイルを解除
      background: var(--flaxen);
      width: 0px;
      box-shadow: -10000px 0 0 10000px var(--flaxen);
      height: 6px;
    }
  }
  .control {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    > * {
      width: 100%;
      display: flex;
      align-items: center;
    }
  }
  .between {
    padding: 0 16px;
    display: flex;
    justify-content: center;
    gap: 8px;
    width: 100%;
    > .center {
      flex-grow: 0;
    }
    > .left,
    > .right {
      flex-grow: 1;
      flex-basis: 0;
      display: flex;
    }
    > .left {
      justify-content: flex-start;
    }
    > .right {
      justify-content: flex-end;
    }
  }
}
</style>
