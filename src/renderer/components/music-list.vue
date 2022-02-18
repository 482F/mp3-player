<template>
  <div
    @drop.prevent="
      (...args) => $emit('insert-musics', ...args)
    "
    @dragenter.prevent
    @dragover.prevent
  >
    <v-list density="compact">
      <div v-for="(music, i) of musics" :key="i">
        <v-list-item>{{ music.name }}</v-list-item>
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
}
</script>
