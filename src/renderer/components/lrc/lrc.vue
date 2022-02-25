<template>
  <div class="lrc">
    <div class="control">
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
          const match = line.match(/^\[(\d+):(\d+)\.(\d+)\](.*)/)
          if (!match) {
            return null
          }
          const time =
            ((Number(match[1]) * 60 + Number(match[2])) * 100 +
              Number(match[3])) *
            10
          const text = match[4]
          return {
            time,
            text,
          }
        })
        .filter(Boolean)
      const maxDiff = 3000
      for (let i = 0; i < data.length - 1; i++) {
        const start = data[i].time
        const end = data[i + 1].time
        const diff = end - start
        if (data[i].text === '' && maxDiff <= diff) {
          const numberOfPadding = Math.floor(diff / maxDiff)
          const times = Array(numberOfPadding)
            .fill(0)
            .map((_, i) => (diff * (i + 1)) / (numberOfPadding + 1) + start)
            .map(Math.round)
          data.splice(i + 1, 0, ...times.map((time) => ({ time, text: '' })))
          i += numberOfPadding
        }
      }
      return data
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
