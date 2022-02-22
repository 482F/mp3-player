<template>
  <div class="music-lists">
    <div class="lists">
      <v-btn
        flat
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
      a: undefined,
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
  }
  .music-list {
    flex-grow: 1;
    overflow-y: scroll;
  }
}
</style>
