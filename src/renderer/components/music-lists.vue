<template>
  <div class="music-lists">
    <div
      class="lists"
      @mousewheel.prevent="(e) => moveList(Math.sign(-e.wheelDelta))"
    >
      <v-list-item
        ref="list"
        class="item"
        :class="currentListIndex === i ? 'current' : ''"
        :rounded="0"
        v-for="(list, i) of lists.filter((list) => list.isDisplay)"
        :key="i"
        @mousedown.left="$emit('update:current-list-index', i)"
        @dblclick="renameList(list, i)"
        @click.middle="list.isDisplay = false"
      >
        <span v-show="list.renaming">
          <input
            ref="renamer"
            class="renamer"
            type="text"
            :value="list.name"
            @blur="(e) => endRename(list, e.target.value)"
            @keypress.enter="(e) => endRename(list, e.target.value)"
          />
        </span>
        <span v-show="!list.renaming">{{ list.name }}</span>
      </v-list-item>
      <v-icon @click="addList">mdi-plus</v-icon>
    </div>
    <music-list
      class="music-list"
      :key="currentListIndex"
      :list="lists[currentListIndex]"
      @delete="(index) => $emit('delete-item', currentList, i)"
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
    info() {
      return this.$store.state.info
    },
  },
  methods: {
    addList() {
      let i = 0
      while (this.lists.find((list) => list.name === 'new' + i)) {
        i++
      }
      this.info.insertPlaylists(['new' + i])
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
    endRename(list, newName) {
      if (newName && !this.lists.find((list) => list.name === newName)) {
        list.renaming = false
        list.name = newName
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.music-lists {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  .lists {
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 1;
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
  }
}
</style>
