<template>
  <div
    class="music-item"
    :class="{ invalid: !music?.id }"
    v-intersect="onIntersect"
  >
    <v-list-item v-if="isIntersect && music?.id">
      <div class="content">
        <div class="left">
          <div class="playing-icon">
            <v-icon v-show="music.isPlaying">mdi-play</v-icon>
          </div>
          <div class="title">{{ music.title }}</div>
        </div>
        <div class="right">
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
        </div>
      </div>
    </v-list-item>
  </div>
</template>

<script>
export default {
  name: 'music-item',
  data() {
    return {
      isIntersect: false,
    }
  },
  props: {
    music: {
      type: Object,
      required: true,
    },
  },
  methods: {
    onIntersect(entries, observer) {
      this.isIntersect = entries
    },
  },
}
</script>

<style lang="scss" scoped>
.music-item {
  height: 40px;
  &.invalid {
    background-color: lightgray;
  }
  > .v-list-item {
    padding: 0px !important;
    .content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      > .left,
      > .right {
        display: flex;
      }
      > .left {
        overflow: hidden;
        > .playing-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          width: 32px;
        }
        > .title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      > .right {
        flex-shrink: 0;
        > .rating {
          padding-right: 16px;
        }
      }
    }
  }
}
</style>
