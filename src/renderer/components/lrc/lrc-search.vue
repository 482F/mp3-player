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
        <v-icon v-else @click="fetchLyric(entity)"> mdi-reload </v-icon>
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
      webviewIf: false,
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
        this.webviewIf = false
        this.loading = true
        this.entities = await this.makeEntities(
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
    async makeEntities(title, artist) {
      const sites = await this.$sendIpc('main', 'getLyricSites', title, artist)
        .then((r) => r?.[0])
        .then((sites) =>
          sites.map((site, i) => ({
            title: site.title,
            lyric: '',
            searching: false,
            getLyric: async () => {
              return await this.$sendIpc(
                'main',
                'getLyric',
                title,
                artist,
                i
              ).then((r) => r?.[0])
            },
          }))
        )
      return sites
    },
    async fetchLyric(entity) {
      entity.searching = true
      entity.lyric = await entity.getLyric()
      entity.searching = false
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
