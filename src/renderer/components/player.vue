<template>
  <div class="f-player">
    <div class="info">
      <div v-if="music">
        {{ music.name }} {{ formatTime(music.currentTime) }} /
        {{ formatTime(music.length) }}
      </div>
    </div>
    <div class="control">
      <div class="center">
        <v-icon @click="$emit('skip', -1)">mdi-skip-previous</v-icon>
        <v-icon v-show="!music?.isPlaying" @click="music.start()">
          mdi-play
        </v-icon>
        <v-icon v-show="music?.isPlaying" @click="music.stop()">
          mdi-pause
        </v-icon>
        <v-icon @click="$emit('skip', 1)">mdi-skip-next</v-icon>
      </div>
      <div class="between">
        <div class="left">
          <input
            class="slider"
            type="range"
            :max="500"
            :value="volume * 100"
            @input="(e) => $emit('update:volume', e.target.valueAsNumber / 100)"
          />
        </div>
        <div class="right">
          <v-icon @click="$emit('export')">mdi-content-save</v-icon>
          <v-icon>mdi-sync</v-icon>
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
import CustomAudio from '@/renderer/classes/custom-audio.js'

export default {
  name: 'player',
  data() {
    return {}
  },
  props: {
    music: {
      type: CustomAudio,
      default: null,
    },
    volume: {
      type: Number,
      default: 1,
    },
  },
  mounted() {},
  methods: {
    setTime(time) {
      if (this.music) {
        this.music.currentTime = time
      }
    },
    formatTime(time) {
      const f = (num) => num.toString().padStart(2, '0')
      const hour = Math.floor(time / (60 * 60))
      const minute = f(Math.floor((time % (60 * 60)) / 60))
      const second = f(Math.floor(time % 60))
      return `${hour ? hour + ':' : ''}${minute}:${second}`
    },
  },
}
</script>

<style lang="scss" scoped>
.f-player {
  height: 128px;
  display: flex;
  flex-direction: column;
  align-items: center;
  .info {
    height: 64px;
  }
  .slider {
    --height: 6px;
    appearance: none;
    background: lightgray;
    height: var(--height);
    margin: 8px;
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
    width: calc(100% - 16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    > * {
      width: 100%;
      display: flex;
      > * {
        display: flex;
        justify-content: center;
      }
    }
    .center {
      justify-content: center;
    }
    .between {
      justify-content: space-between;
    }
  }
}
</style>
