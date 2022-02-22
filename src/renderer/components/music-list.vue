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
        class="item"
        v-for="(music, i) of musics"
        :key="i"
        :class="{ selected: selectedIndice.includes(i) }"
        @click="(e) => select(e, i)"
        @dblclick="$emit('open', music, i)"
      >
        <div>
          <v-list-item :value="music">{{ music.name }}</v-list-item>
        </div>
      </div>
    </v-list>
  </div>
</template>

<script>
export default {
  name: 'music-list',
  props: {
    musics: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      selectedIndice: [],
    }
  },
  methods: {
    select(e, i) {
      if (e.shiftKey) {
        const start = this.selectedIndice.at(-1)
        const end = i
        const sign = Math.sign(end - start)
        const newIndice = Array((end - start) * sign + 1)
          .fill(0)
          .map((_, i) => sign * i + start)
        this.selectedIndice.push(...newIndice)
      } else if (e.ctrlKey) {
        this.selectedIndice.push(i)
      } else {
        this.selectedIndice = [i]
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.music-list {
  .item {
    user-select: none;
  }
  .item.selected {
    background-color: var(--flaxen);
  }
}
</style>
