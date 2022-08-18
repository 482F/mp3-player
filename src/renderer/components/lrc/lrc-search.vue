<template>
  <div class="lrc-search">
    <loading-icon v-if="loading" />
    <div class="entities">
      <div v-if="entities.length === 0 && !loading">
        <div>適切な歌詞が見つかりませんでした</div>
      </div>
      <div v-for="entity of entities" :key="entity.href" class="entity">
        <v-icon v-if="entity.lyric" @click="copy(entity.lyric)">
          mdi-content-copy
        </v-icon>
        <loading-icon v-else-if="entity.searching" />
        <v-icon v-else @click="fetchLyric(entity)">
          {{ entity.failed ? 'mdi-alert-circle-outline' : 'mdi-reload' }}
        </v-icon>
        <span :title="entity.lyric">{{ entity.title }}</span>
      </div>
      <div>
        <v-icon @click="$emit('search-by-browser')">mdi-google-chrome</v-icon>
        <span>ブラウザで検索する</span>
      </div>
    </div>
  </div>
</template>

<script>
import LoadingIcon from '../loading-icon.vue'

export default {
  name: 'lrc-search',
  components: {
    LoadingIcon,
  },
  data() {
    return {
      src: '',
      entities: [],
      loading: false,
    }
  },
  props: {
    music: {
      type: Object,
      required: true,
    },
  },
  watch: {
    music: {
      immediate: true,
      async handler() {
        this.entities = []
        this.loading = true
        this.entities = await window.lyric.searchLyricSites(
          this.music.title,
          this.music.artist
        )
        this.loading = false
      },
    },
  },
  methods: {
    copy(lyric) {
      navigator.clipboard.writeText(lyric)
    },
    async fetchLyric(entity) {
      entity.searching = true
      try {
        entity.lyric = await window.lyric.getLyric(entity.domain, entity.href)
      } catch (e) {
        entity.failed = true
        throw e
      } finally {
        entity.searching = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.lrc-search {
  cursor: default;
  > .entities {
    > * {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
