<template>
  <div
    class="music-list"
    @drop.prevent="(e) => insertMusics([...(e.dataTransfer.files ?? [])])"
    @dragenter.prevent
    @dragover.prevent
  >
    <v-list density="compact" v-if="list?.musics">
      <draggable
        ref="list"
        :list="searchedMusics"
        @end="(e) => list.moveMusic(e.oldIndex, e.newIndex)"
        :animation="200"
        ghostClass="dragging"
        item-key="index"
      >
        <template #item="{ element: music }">
          <div
            class="music-item"
            :key="music.index"
            @dragstart="dragStart"
            @dblclick="
              (e) => {
                if (!e.shiftKey && !e.ctrlKey) {
                  $emit('open', music, i)
                }
              }
            "
            @click.middle="list.removeMusic(music.index)"
          >
            <music-item :music="music" @delete="$emit('delete', i)" />
          </div>
        </template>
      </draggable>
    </v-list>
    <div ref="ghost" />
  </div>
</template>

<script>
import MusicItem from './music-item.vue'
import Playlist from '../classes/playlist.js'
import Draggable from 'vuedraggable'

export default {
  name: 'music-list',
  components: {
    MusicItem,
    Draggable,
  },
  props: {
    list: {
      type: Playlist,
      required: true,
    },
    searchText: {
      type: String,
      default: '',
    },
  },
  data() {
    return {}
  },
  computed: {
    searchedMusics() {
      return this.searchText === ''
        ? this.list.musics
        : this.list.musics.filter((music) => music.title.match(this.searchText))
    },
    info() {
      return this.$store.state.info
    },
  },
  methods: {
    dragStart(e) {
      e.dataTransfer.setDragImage(this.$refs.ghost, 0, 0)
    },
    insertMusics(files) {
      if (!files.length) {
        return
      }
      this.list.insertMusics(0, files.map((file) => file.path).sort())
    },
  },
}
</script>

<style lang="scss" scoped>
.music-list {
  > .v-list {
    .music-item {
      user-select: none;
    }
    .dragging {
      opacity: 0.6;
    }
  }
}
</style>
