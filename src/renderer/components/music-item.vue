<template>
  <div class="music-item">
    <v-list-item>
      <div class="playing-icon">
        <v-icon v-show="music.isPlaying">mdi-play</v-icon>
      </div>
      <div>{{ music.name }}</div>
    </v-list-item>
  </div>
</template>

<script>
export default {
  name: 'music-item',
  props: {
    music: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style lang="scss" scoped>
.music-item {
  .playing-icon {
    width: 32px;
  }
}
</style>
