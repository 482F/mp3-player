<template>
  <div class="lrc-show" :style="{ '--line-height': lineHeight + 'px' }">
    <div class="padding" />
    <div class="body" :style="{ '--offset': offset + 'px' }">
      <div
        v-for="({ text: line }, i) of lyricData"
        :key="i"
        class="line"
        :class="{ current: currentIndex === i }"
      >
        {{ line }}
      </div>
    </div>
  </div>
</template>

<script>
const lineHeight = 24

export default {
  name: 'lrc',
  data() {
    return {}
  },
  props: {
    music: {
      type: Object,
      required: true,
    },
    lyricData: {
      type: Array,
      required: true,
    },
  },
  computed: {
    lineHeight: () => lineHeight,
    currentTime() {
      return (this.music?.currentTime ?? 0) * 1000
    },
    currentIndex() {
      const currentIndex =
        this.lyricData.findIndex(({ time }) => this.currentTime < time) - 1
      return currentIndex === -2 ? this.lyricData.length - 1 : currentIndex
    },
    offset() {
      if (this.currentIndex === -1) {
        return 0
      }
      const partStart = this.lyricData[this.currentIndex].time
      const partEnd = this.lyricData[this.currentIndex + 1]?.time ?? Infinity
      const decimalPart = (this.currentTime - partStart) / (partEnd - partStart)
      return Math.round((this.currentIndex + decimalPart) * lineHeight)
    },
  },
}
</script>

<style lang="scss" scoped>
.lrc-show {
  line-height: var(--line-height);
  overflow: hidden;
  height: 100%;
  > .padding {
    height: 50%;
  }
  > .body {
    margin-top: calc(-1 * var(--offset));
    > .line {
      height: var(--line-height);
      color: #888;
      &.current {
        color: black;
      }
    }
  }
}
</style>
