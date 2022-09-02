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
          :style="{ color, ...heights?.[i]?.[j] }"
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
    averageDiff() {
      return this.lyricData.map((column) => {
        const diffs = []
        for (let i = 0; i < column.length - 1; i++) {
          if (column[i].text === '') {
            continue
          }
          const start = column[i].time
          const end = column[i + 1].time
          const diff = end - start
          diffs.push(diff)
        }
        return diffs.reduce((sum, num) => (sum += num), 0) / diffs.length
      })
    },
    heights() {
      return this.lyricData.map((column, i) =>
        column.map((row, j) => {
          if (row.text !== '') {
            return {}
          }
          const nextRow = column[j + 1]
          if (!nextRow) {
            return {}
          }
          const diff = nextRow.time - row.time
          const rate = diff / this.averageDiff[i]
          const height = `${lineHeight * rate}px`
          return { height }
        })
      )
    },
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
  cursor: default;
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
