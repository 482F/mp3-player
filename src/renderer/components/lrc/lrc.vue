<template>
  <div class="lrc">
    <div class="control">
      <v-icon v-if="!editing" @click="$emit('update:editing', true)">
        mdi-pencil
      </v-icon>
      <template v-else>
        <v-icon
          @click="searching = !searching"
          :style="{ color: searching ? 'black' : 'lightgray' }"
        >
          mdi-web
        </v-icon>
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
      <template v-if="editing">
        <lrc-search
          v-if="searching"
          class="lrc-search"
          :music="music"
          @search-by-browser="searchLyricByBrowser"
        />
        <lrc-edit
          class="lrc-edit"
          :music="music"
          v-model:raw-lyric="rawLyric"
          @save="save"
        />
      </template>
      <lrc-show class="lrc-show" :music="music" :lyric-data="lyricData" />
    </div>
  </div>
</template>

<script>
import LrcShow from './lrc-show.vue'
import LrcSearch from './lrc-search.vue'
import LrcEdit from './lrc-edit.vue'

export default {
  name: 'lrc',
  components: {
    LrcShow,
    LrcSearch,
    LrcEdit,
  },
  data() {
    return {
      rawLyric: '',
      ready: false,
      searching: false,
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
      this.searching = false
      if (!this.music) {
        return
      }
      this.rawLyric = this.music.lyric
      this.ready = true
    },
    searchLyricByBrowser() {
      if (this.music) {
        this.$openGoogleSearch(
          [this.music.title, this.music.artist ?? '', '歌詞'].join(' ')
        )
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
