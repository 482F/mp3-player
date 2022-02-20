<template>
  <div class="music-lists">
    <div class="lists" @mousewheel="(e) => moveList(Math.sign(-e.wheelDelta))">
      <v-list-item
        ref="list"
        class="item"
        :class="currentListIndex === i ? 'current' : ''"
        :rounded="0"
        v-for="(list, i) of lists"
        :key="i"
        @mousedown="$emit('update:current-list-index', i)"
        @dblclick="renameList(list, i)"
        @click.middle="lists.splice(i, 1)"
      >
        <span v-show="list.renaming">
          <input
            ref="renamer"
            class="renamer"
            type="text"
            :value="list.name"
            @input="(e) => (list.name = e.target.value)"
            @blur="endRename(list)"
            @keypress.enter="endRename(list)"
          />
        </span>
        <span v-show="!list.renaming">{{ list.name }}</span>
      </v-list-item>
      <v-icon @click="addList">mdi-plus</v-icon>
    </div>
    <music-list
      class="music-list"
      :key="currentListIndex"
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
    return {}
  },
  props: {
    lists: {
      type: Array,
      default: () => [],
    },
    currentListIndex: {
      type: Number,
      default: 0,
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
      this.$emit(
        'update:current-list-index',
        (this.currentListIndex + delta + this.lists.length) % this.lists.length
      )
      this.$refs.list[this.currentListIndex].$el.scrollIntoView({
        behavior: 'smooth',
      })
    },
    async renameList(list, index) {
      list.renaming = true
      await this.$nextTick()
      this.$refs.renamer[index].focus()
    },
    endRename(list) {
      list.renaming = false
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
    .item {
      background-color: #eee;
      user-select: none;
      &.current {
        background-color: #c7b897;
      }
    }
  }
  .music-list {
    flex-grow: 1;
    overflow-y: scroll;
  }
}
</style>
