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
        <v-icon>mdi-skip-previous</v-icon>
        <v-icon>mdi-stop</v-icon>
        <v-icon>mdi-play</v-icon>
        <v-icon>mdi-pause</v-icon>
        <v-icon>mdi-skip-next</v-icon>
      </div>
      <div class="between">
        <div class="left">
          <input
            class="volume-slider"
            type="range"
            :max="500"
            :value="volume * 100"
            @input="(e) => $emit('update:volume', e.target.valueAsNumber / 100)"
          />
        </div>
        <div class="right">
          <v-icon>mdi-sync</v-icon>
          <v-icon>mdi-shuffle</v-icon>
        </div>
      </div>
      <input
        class="time-slider"
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
  data() {},
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
