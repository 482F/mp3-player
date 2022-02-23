<template>
  <div class="lrc">
    <div class="control">
      <v-icon v-if="!editing" @click="editing = true"> mdi-pencil </v-icon>
      <template v-else>
        <v-icon> mdi-close </v-icon>
        <v-icon> mdi-check </v-icon>
      </template>
    </div>
    <template v-if="ready">
      <lrc-edit v-if="editing" class="lrc-edit" />
      <lrc-show
        v-else
        class="lrc-show"
        :music="music"
        :lyric-data="lyricData"
      />
    </template>
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
      editing: false,
      lyricData: null,
      ready: false,
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
      this.ready = false
      if (!this.music) {
        return
      }
      const lyric = await this.$getLyric(this.music.filePath)
      this.lyricData = lyric
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
      this.ready = true
    },
  },
}
</script>

<style lang="scss" scoped>
.lrc {
  .control {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
