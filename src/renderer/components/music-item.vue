<template>
  <div class="music-item">
    <v-list-item>
      <div class="playing-icon">
        <v-icon v-show="music.isPlaying">mdi-play</v-icon>
      </div>
      <div>{{ music.name }}</div>
      <div class="rating">
        <v-icon
          v-for="i of 5"
          :key="i"
          size="x-small"
          @click="music.rating = i"
        >
          {{ i <= (music.rating ?? 0) ? 'mdi-star' : 'mdi-star-outline' }}
        </v-icon>
      </div>
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
  position: relative;
  .v-list-item {
    .playing-icon {
      width: 32px;
    }
    .rating {
      position: absolute;
      right: 0;
      padding-right: 16px;
    }
  }
}
</style>
