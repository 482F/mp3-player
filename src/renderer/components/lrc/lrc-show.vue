<template>
  <div class="lrc-show" :style="{ '--line-height': lineHeight + 'px' }">
    <div class="padding" />
    <div class="body">
      <div
        class="column"
        ref="columns"
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
          <div class="mask" />
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
        const lines = [...(this.$refs.columns?.[i]?.children ?? [])]
        if (currentIndex === -1 || lines.length <= currentIndex) {
          return 0
        }
        const partStart = column[currentIndex].time
        const partEnd = column[currentIndex + 1]?.time ?? Infinity
        const decimalPart =
          (this.currentTime - partStart) / (partEnd - partStart)
        const pastLinesHeight = lines
          .slice(0, currentIndex)
          .map((line) => line.clientHeight)
          .reduce((sum, num) => (sum += num), 0)
        const processingLineOffset = lines[currentIndex].clientHeight
        return pastLinesHeight + Math.round(processingLineOffset * decimalPart)
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
    gap: 8px;
    > .column {
      width: 100%;
      margin-top: calc(-1 * var(--offset));
      > .line {
        min-height: var(--line-height);
        position: relative;
        &:not(.current) {
          > .mask {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            background-color: #ffffff77;
          }
        }
      }
    }
  }
}
</style>
