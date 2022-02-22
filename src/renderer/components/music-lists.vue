<template>
  <div class="music-lists">
    <div
      class="lists"
      @mousewheel="(e) => moveList(Math.sign(-e.wheelDelta))"
    >
      <v-btn
        flat
        ref="list"
        :color="currentListIndex === i ? '#ddd' : 'white'"
        :rounded="0"
        v-for="(list, i) of lists"
        :key="i"
        @click="currentListIndex = i"
      >
        {{ list.name }}
      </v-btn>
      <v-icon @click="addList">mdi-plus</v-icon>
    </div>
    <music-list
      class="music-list"
      :musics="currentList?.musics ?? []"
      @insert-musics="(files) => $emit('insert-musics', currentList, files)"
      @open="(music, index) => $emit('open', music, currentList, index)"
    />
  </div>
</template>

<script>
import MusicList from './music-list.vue'

export default {
  name: 'music-lists',
  components: {
    MusicList,
  },
  data() {
    return {
      currentListIndex: 0,
    }
  },
  props: {
    lists: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    currentList() {
      return this.lists[this.currentListIndex]
    },
  },
  methods: {
    addList() {
      this.$emit('update:lists', [...this.lists, { name: 'new', musics: [] }])
    },
    moveList(delta) {
      this.currentListIndex =
        (this.currentListIndex + delta + this.lists.length) % this.lists.length
      this.$refs.list[this.currentListIndex].$el.scrollIntoView({
        behavior: 'smooth',
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.music-lists {
  min-height: 0;
  display: flex;
  flex-direction: column;
  .lists {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    overflow-y: hidden;
    overflow-x: scroll;
    &::-webkit-scrollbar {
      width: 0px !important;
      height: 0px !important;
    }
  }
  .music-list {
    flex-grow: 1;
    overflow-y: scroll;
  }
}
</style>
