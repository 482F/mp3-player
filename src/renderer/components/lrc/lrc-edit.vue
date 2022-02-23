<template>
  <div class="lrc-edit">
    <textarea
      ref="textarea"
      :value="rawLyricData"
      @keydown="onKeydown"
      @input="onInput"
    />
  </div>
</template>

<script>
export default {
  name: 'lrc-edit',
  data() {
    return {}
  },
  props: {
    music: {
      type: Object,
      required: true,
    },
    rawLyric: {
      type: String,
      required: true,
    },
  },
  computed: {
    rawLyricData: {
      get() {
        return this.rawLyric
      },
      set(value) {
        this.$emit('update:raw-lyric', value)
      },
    },
  },
  mounted() {
    this.rawLyricData = this.rawLyric
  },
  methods: {
    getSelectedLineIndex() {
      const selectionStart = this.$refs.textarea.selectionStart
      let lengthSum = 0
      const lines = this.rawLyricData.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        lengthSum += line.length + 1
        if (selectionStart < lengthSum) {
          return i
        }
      }
    },
    setSelectedLineIndex(lineIndex) {
      const lines = this.rawLyricData.split('\n')
      const lengthSum = lines
        .map((line) => line + ' ')
        .slice(0, lineIndex)
        .join('').length
      this.$refs.textarea.selectionStart = lengthSum
      this.$refs.textarea.selectionEnd = lengthSum
    },
    async onKeydown(e) {
      if (e.ctrlKey) {
        if (e.code === 'Enter') {
          const index = this.getSelectedLineIndex()
          if (e.shiftKey) {
            this.insertNewline(index)
          } else {
            this.setTime(index)
          }
          await this.$nextTick()
          this.setSelectedLineIndex(index + 1)
        } else if (e.code === 'Digit0') {
          const index = this.getSelectedLineIndex()
          this.setTime(index, 0)
          await this.$nextTick()
          this.setSelectedLineIndex(index + 1)
        }
      }
    },
    onInput(e) {
      this.rawLyricData = e.target.value
    },
    insertNewline(lineIndex) {
      const lines = this.rawLyricData.split('\n')
      lines.splice(lineIndex + 1, 0, '')
      this.rawLyricData = lines.join('\n')
    },
    setTime(lineIndex, time = null) {
      time ??= this.music.currentTime
      const formattedTime = (() => {
        const df = (num) => Math.floor(num).toString().padStart(2, '0')
        const m = df(time / 60)
        const s = df(time % 60)
        const ms = df((time * 100) % 100)
        return `${m}:${s}.${ms}`
      })()
      const lines = this.rawLyricData.split('\n')
      lines[lineIndex] =
        `[${formattedTime}]` + lines[lineIndex].replace(/^\[\d+:\d+\.\d+\]/, '')
      this.rawLyricData = lines.join('\n')
    },
  },
}
</script>

<style lang="scss" scoped>
.lrc-edit {
  height: 100%;
  > textarea {
    resize: none;
    height: 100%;
    width: 100%;
  }
}
</style>
