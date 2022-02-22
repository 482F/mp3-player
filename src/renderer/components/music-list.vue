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
        @mousedown="(e) => select(e, i)"
        @dblclick="
          (e) => {
            if (!e.shiftKey && !e.ctrlKey) {
              $emit('open', music, i)
            }
          }
        "
      >
        <div>
          <v-list-item>{{ music.name }}</v-list-item>
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
    select({ shiftKey, ctrlKey }, index) {
      if (shiftKey) {
        const start = this.selectedIndice.at(-1)
        const end = index
        const sign = Math.sign(end - start)
        const newIndice = Array((end - start) * sign)
          .fill(0)
          .map((_, index) => sign * (index + 1) + start)
        this.selectedIndice.push(...newIndice)
      } else if (ctrlKey) {
        const targetIndex = this.selectedIndice.findIndex(
          (selectedIndex) => selectedIndex === index
        )
        if (targetIndex === -1) {
          this.selectedIndice.push(index)
        } else {
          this.selectedIndice.splice(targetIndex, 1)
        }
      } else {
        this.selectedIndice = [index]
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
