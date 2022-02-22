<template>
  <div
    @drop.prevent="
      (e) => $emit('insert-musics', [...(e.dataTransfer.files ?? [])])
    "
    @dragenter.prevent
    @dragover.prevent
  >
    <v-list density="compact">
      <div
        v-for="(music, i) of musics"
        :key="i"
        @dblclick="$emit('open', music, i)"
      >
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
