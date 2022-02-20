<template>
  <div
    class="music-list"
    @drop.prevent="
      (e) => $emit('insert-musics', [...(e.dataTransfer.files ?? [])])
    "
    @dragenter.prevent
    @dragover.prevent
  >
    <v-list density="compact">
      <div
        class="music-item"
        v-for="(music, i) of musics"
        :key="i"
        :class="{ selected: music.selected }"
        @mousedown="(e) => select(e, i)"
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

export default {
  name: 'music-list',
  components: {
    MusicItem,
  },
  props: {
    musics: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      lastSelected: null,
      selectedMusics: [],
    }
  },
  mounted() {
    this.selectedMusics = this.musics.filter((music) => music.selected)
  },
  methods: {
    select({ shiftKey, ctrlKey }, index) {
      if (shiftKey && this.lastSelected) {
        const start = this.lastSelected
        const end = index
        const sign = Math.sign(end - start)
        const newIndice = Array((end - start) * sign)
          .fill(0)
          .map((_, index) => sign * (index + 1) + start)
        newIndice.forEach((index) => (this.musics[index].selected = true))
        this.lastSelected = index
      } else if (ctrlKey) {
        this.musics[index].selected = !this.musics[index].selected
        this.lastSelected = this.lastSelected ? index : null
      } else {
        if (!shiftKey) {
          this.selectedMusics.forEach((music) => (music.selected = false))
          this.selectedMusics = []
        }
        this.musics[index].selected = true
        this.selectedMusics.push(this.musics[index])
        this.lastSelected = index
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.music-list {
  .music-item {
    user-select: none;
    &.selected {
      background-color: var(--flaxen);
    }
  }
}
</style>
