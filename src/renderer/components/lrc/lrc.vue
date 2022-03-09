<template>
  <div class="lrc">
    <div class="control">
      <v-icon @click="searchLyricByBrowser">mdi-web</v-icon>
      <v-icon v-if="!editing" @click="$emit('update:editing', true)">
        mdi-pencil
      </v-icon>
      <template v-else>
        <v-icon @click="cancel"> mdi-close </v-icon>
        <v-icon
          @click="
            () => {
              save()
              $emit('update:editing', false)
            }
          "
        >
          mdi-check
        </v-icon>
      </template>
    </div>
    <div class="body" v-if="ready">
      <lrc-edit
        v-if="editing"
        class="lrc-edit"
        :music="music"
        v-model:raw-lyric="rawLyric"
        @save="save"
      />
      <lrc-show class="lrc-show" :music="music" :lyric-data="lyricData" />
    </div>
  </div>
</template>

<script>
import LrcShow from './lrc-show.vue'
import LrcEdit from './lrc-edit.vue'

export default {
  name: 'lrc',
  components: {
    LrcShow,
    LrcEdit,
  },
  data() {
    return {
      rawLyric: '',
      ready: false,
    }
  },
  props: {
    music: {
      type: Object,
      default: null,
    },
    editing: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    lyricData() {
      const data = this.rawLyric
        .split('\n')
        .map((line) => {
          const match = line.match(
            /^\[(\d+):(\d+)\.(\d+)\](\((\d+)\))?(\{(\d+)\})?(.*)/
          )
          if (!match) {
            return null
          }
          const [
            ,
            minutes,
            seconds,
            milliseconds,
            ,
            column,
            ,
            colorIndex,
            text,
          ] = match
          const time =
            ((Number(minutes) * 60 + Number(seconds)) * 100 +
              Number(milliseconds)) *
            10
          return {
            time,
            text,
            column,
            colorIndex,
          }
        })
        .filter(Boolean)
      const columnDict = { 0: [] }
      for (const datum of data) {
        columnDict[datum.column] ??= []
        columnDict[datum.column].push(datum)
      }

      const columnKeys = Object.keys(columnDict).filter(
        (key) => key !== 'undefined'
      )
      for (const columnKey of columnKeys) {
        if (columnDict[undefined]) {
          for (const undefinedRow of columnDict[undefined]) {
            columnDict[columnKey].push({ ...undefinedRow, column: columnKey })
          }
        }
        columnDict[columnKey] = columnDict[columnKey].sort(
          (a, b) => a.time - b.time
        )
      }
      const colorDict = {}
      for (const colorData of [...this.rawLyric.matchAll(/\{(\d+):(.+?)\}/g)]) {
        colorDict[colorData[1]] = colorData[2]
      }
      for (const columnKey of columnKeys) {
        for (const row of columnDict[columnKey]) {
          row.color =
            colorDict[row.colorIndex] ??
            colorDict[row.column] ??
            colorDict[columnKey] ??
            'black'
        }
      }
      delete columnDict[undefined]

      const splittedData = Object.values(columnDict)

      for (const column of splittedData) {
        column.unshift({
          time: 0,
          text: '',
          column: column.column,
          color: 'black',
        })
        column.push({
          time: this.music.length * 1000,
          text: '',
          column: column.column,
          color: 'black',
        })
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
        const maxDiff =
          diffs.reduce((sum, num) => (sum += num), 0) / diffs.length
        for (let i = 0; i < column.length - 1; i++) {
          const start = column[i].time
          const end = column[i + 1].time
          const diff = end - start
          if (column[i].text === '' && maxDiff <= diff) {
            const numberOfPadding = Math.floor(diff / maxDiff)
            const times = Array(numberOfPadding)
              .fill(0)
              .map((_, i) => (diff * (i + 1)) / (numberOfPadding + 1) + start)
              .map(Math.round)
            column.splice(
              i + 1,
              0,
              ...times.map((time) => ({ time, text: '' }))
            )
            i += numberOfPadding
          }
        }
      }
      return splittedData
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
      this.ready = false
      if (!this.music) {
        return
      }
      this.rawLyric = this.music.lyric
      this.ready = true
    },
    searchLyricByBrowser() {
      if (this.music) {
        this.$openGoogleSearch(this.music.title + ' 歌詞')
      }
    },
    cancel() {
      this.rawLyric = this.music.lyric
      this.$emit('update:editing', false)
    },
    async save() {
      this.music.lyric = this.rawLyric
    },
  },
}
</script>

<style lang="scss" scoped>
.lrc {
  display: flex;
  flex-direction: column;
  > .control {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  > .body {
    min-height: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    > * {
      padding: 4px;
    }
    > .lrc-edit {
      background-color: #eee;
    }
  }
}
</style>
