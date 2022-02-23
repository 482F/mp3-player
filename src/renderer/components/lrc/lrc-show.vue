<template>
  <div class="lrc-show" :style="{ '--line-height': lineHeight + 'px' }">
    <div class="padding" />
    <div class="body">
      <div
        class="column"
        v-for="(column, i) of lyricData"
        :key="i"
        :style="{ '--offset': offsets[i] + 'px' }"
      >
        <div
          v-for="({ text: line, color }, j) of column"
          :key="j"
          class="line"
          :class="{ current: currentIndice[i] === j }"
          :style="{ color }"
        >
          {{ line }}
        </div>
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
      return Math.round((this.music?.currentTime ?? 0) * 1000)
    },
    currentIndice() {
      return this.lyricData.map((column) => {
        const currentIndex =
          column.findIndex(({ time }) => this.currentTime < time) - 1
        return currentIndex === -2 ? column.length - 1 : currentIndex
      })
    },
    offsets() {
      return this.lyricData.map((column, i) => {
        const currentIndex = this.currentIndice[i]
        if (currentIndex === -1) {
          return 0
        }
        const partStart = column[currentIndex].time
        const partEnd = column[currentIndex + 1]?.time ?? Infinity
        const decimalPart =
          (this.currentTime - partStart) / (partEnd - partStart)
        return Math.round((currentIndex + decimalPart) * lineHeight)
      })
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
    display: flex;
    > .column {
      flex-grow: 1;
      margin-top: calc(-1 * var(--offset));
      position: relative;
      > .line {
        height: var(--line-height);
        &:not(.current) {
          &::after {
            content: '';
            width: 100%;
            height: var(--line-height);
            position: absolute;
            left: 0;
            background-color: #ffffff77;
          }
        }
      }
    }
  }
}
</style>
