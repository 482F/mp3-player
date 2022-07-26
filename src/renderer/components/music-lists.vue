<template>
  <div class="music-lists">
    <div class="header">
      <div>
        <div
          class="lists"
          @mousewheel.prevent="(e) => moveList(Math.sign(-e.wheelDelta))"
        >
          <v-list-item
            ref="list"
            class="item"
            :class="info.currentListIndex === list.index ? 'current' : ''"
            :rounded="0"
            v-for="list of lists.filter((list) => list.isDisplay)"
            :key="list.id"
            @mousedown.left="info.currentListIndex = list.index"
            @dblclick="renameList(list, list.index)"
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
          <v-icon class="plus" @click="addList">mdi-plus</v-icon>
        </div>
        <v-icon
          class="sort"
          @click="scrollToPlayingItem"
          :color="info.autoScroll ? 'black' : '#ccc'"
        >
          mdi-debug-step-into
        </v-icon>
      </div>
      <div>
        <v-text-field
          v-model="searchText"
          class="search"
          density="compact"
          variant="underlined"
          clearable
        />
      </div>
    </div>
    <music-list
      class="music-list"
      ref="musicList"
      :key="info.currentListIndex"
      :list="lists[info.currentListIndex]"
      :search-text="searchText"
      @delete="(index) => $emit('delete-item', currentList, i)"
      @open="(music, index) => $emit('open', music, currentList, index)"
      @mousewheel="info.autoScroll = false"
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
      searchText: '',
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
      return this.lists[this.info.currentListIndex]
    },
    info() {
      return this.$store.state.info
    },
  },
  mounted() {
    this.scrollToPlayingItem()
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
      this.info.currentListIndex +=
        (delta + this.lists.length) % this.lists.length
      this.$refs.list[this.info.currentListIndex].$el.scrollIntoView({
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
    async scrollToPlayingItem() {
      this.info.autoScroll = true
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        if (this.$refs.musicList.$refs.list) break
      }
      const items = [...this.$refs.musicList.$refs.list.$el.children]
      const item = items[this.currentList.playingIndex]
      if (!item) {
        return
      }
      item.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    },
  },
  watch: {
    'currentList.playingIndex': function () {
      if (!this.info.autoScroll) {
        return
      }
      this.scrollToPlayingItem()
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
  > .header {
    width: 100%;
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 1;
    display: flex;
    flex-direction: column;
    > * {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
        .plus {
          margin-left: 4px;
        }
      }
      .sort {
        margin-right: 4px;
      }
      .search {
        margin: 0 1rem;
        > ::v-deep(.v-input__details) {
          display: none;
        }
      }
    }
  }
  .music-list {
    flex-grow: 1;
  }
}
</style>
