<template>
  <div
    class="music-list"
    @drop.prevent="(e) => insertMusics([...(e.dataTransfer.files ?? [])])"
    @dragenter.prevent
    @dragover.prevent
  >
    <v-list density="compact">
      <div
        class="music-item"
        v-for="(music, i) of list?.musics ?? []"
        :key="i"
        @dblclick="
          (e) => {
            if (!e.shiftKey && !e.ctrlKey) {
              $emit('open', music, i)
            }
          }
        "
      >
        <music-item :music="music" @delete="$emit('delete', i)" />
      </div>
    </v-list>
  </div>
</template>

<script>
import MusicItem from './music-item.vue'
import Playlist from '../classes/playlist.js'

export default {
  name: 'music-list',
  components: {
    MusicItem,
  },
  props: {
    list: {
      type: Playlist,
      required: true,
    },
  },
  data() {
    return {}
  },
  computed: {
    info() {
      return this.$store.state.info
    },
  },
  methods: {
    insertMusics(files) {
      this.list.insertMusics(
        0,
        files.map((file) => file.path)
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.music-list {
  .music-item {
    user-select: none;
  }
}
</style>
