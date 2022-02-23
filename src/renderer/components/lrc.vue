<template>
  <div class="lrc" :style="{ '--line-height': lineHeight + 'px' }">
    <div class="padding" />
    <div class="body" :style="{ '--offset': offset + 'px' }">
      <div
        v-for="({ text: line }, i) of metadata"
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
    return {
      lyric: '',
      metadata: [],
    }
  },
  props: {
    music: {
      type: Object,
      default: null,
    },
  },
  watch: {
    async music() {
      await this.init()
    },
  },
  async mounted() {
    await this.init()
  },
  methods: {
    async init() {
      this.lyric = await this.$getLyric(this.music.filePath)
      this.metadata = this.lyric
        .split('\n')
        .map((line) => {
          const match = line.match(/^\[(\d+):(\d+)\.(\d+)\](.*)/)
          if (!match) {
            return null
          }
          const time =
            (Number(match[1]) * 60 + Number(match[2])) * 1000 + Number(match[3])
          const text = match[4]
          return {
            time,
            text,
          }
        })
        .filter(Boolean)
    },
  },
  computed: {
    lineHeight: () => lineHeight,
    currentTime() {
      return (this.music?.currentTime ?? 0) * 1000
    },
    currentIndex() {
      const currentIndex =
        this.metadata.findIndex(({ time }) => this.currentTime < time) - 1
      return currentIndex === -2 ? this.metadata.length - 1 : currentIndex
    },
    offset() {
      if (this.currentIndex === -1) {
        return 0
      }
      const partStart = this.metadata[this.currentIndex].time
      const partEnd = this.metadata[this.currentIndex + 1]?.time ?? Infinity
      const decimalPart = (this.currentTime - partStart) / (partEnd - partStart)
      return Math.round((this.currentIndex + decimalPart) * lineHeight)
    },
  },
}
</script>

<style lang="scss" scoped>
.lrc {
  line-height: var(--line-height);
  margin: 16px;
  overflow: hidden;
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
