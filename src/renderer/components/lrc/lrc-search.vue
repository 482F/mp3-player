<template>
  <div class="lrc-search">
    <custom-webview
      v-if="webviewIf"
      ref="customWebview"
      :src="src"
      style="height: 0px"
    />
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
import CustomWebview from '../custom-webview.vue'
import LoadingIcon from '../loading-icon.vue'

const domainFuncs = {
  'www.uta-net.com': async () => {
    while (!document.getElementById('kashi_area')) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return document
      .getElementById('kashi_area')
      .innerText.replaceAll(/\n+/g, '\n')
  },
  'utaten.com': async () => {
    const lyrics = Array.from(document.querySelector('.hiragana').childNodes)
    return lyrics
      .map((node) => {
        if (node.nodeName === '#text') {
          return node.textContent
        } else if (node.nodeName === 'SPAN') {
          return node.children[0].innerText
        }
        return ''
      })
      .reduce((all, part) => all + part, '')
  },
  'www.utamap.com': async () => {
    return document.querySelector('td.noprint.kasi_honbun').innerText
  },
  'j-lyric.net': async () => {
    return document.getElementById('Lyric').innerText
  },
  'petitlyrics.com': async () => {
    const df = (num) => num.toString().padStart(2, '0')

    let date = new Date()
    let today = ''
    today += date.getFullYear()
    today += df(date.getMonth() + 1)
    today += df(date.getDate())
    today += df(date.getHours())
    today += df(date.getMinutes())
    today += df(date.getSeconds())

    const csrfToken = await fetch(
      'https://petitlyrics.com/lib/pl-lib.js?20220727191458'
    )
      .then((r) => r.text())
      .then((text) => text.match(/'X-CSRF-Token', '([^']+)'/)[1])
    const id = location.href.match(/\d+$/)[0]

    const data = await fetch('https://petitlyrics.com/com/get_lyrics.ajax', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-CSRF-Token': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: `lyrics_id=${id}`,
      method: 'POST',
    }).then((r) => r.json())

    const lyric = data.map(({ lyrics }) => Base64.decode(lyrics)).join('\n')
    return lyric
  },
}
const googleFunc = async () => {
  const children = [...document.querySelectorAll('div')].find(
    (e) => e.children.length === 0 && e.innerText === '歌詞は印刷できません'
  )?.nextSibling?.firstChild?.children
  if (!children?.length) return
  const child = (() => {
    if (children[1].innerText.match('提供元')) {
      return children[0]
    } else {
      return children[1]
    }
  })()

  const lyric = formatLyric(child?.innerText)

  const titleEl = document.querySelector('[data-attrid="title"]')
  if (!titleEl) return
  const name = titleEl.innerText
  const artist = titleEl.nextElementSibling.innerText.replace(/の曲$/, '')

  return { lyric, title: `${name} ${artist}` }
}

const formatLyric = (rawLyric) =>
  rawLyric
    .replaceAll(/\n+/g, '\n')
    .replaceAll(/^\s+/g, '')
    .replaceAll(/　/g, ' ')

export default {
  name: 'lrc-search',
  components: {
    CustomWebview,
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
        this.entities = []
        this.webviewIf = false
        this.loading = true
        await new Promise((resolve) => setTimeout(resolve, 100))
        this.webviewIf = true
        const query = [this.music.title, this.music.artist ?? '', '歌詞']
          .join(' ')
          .replaceAll(' ', '+')
          .replaceAll('&', ' ')
        this.src = `https://www.google.com/search?q=${query}`
        // ホワイトリストに URL を登録 (うたてん、歌net等)
        // ホワイトリストに一致する URL を href にもつ a の情報と、google 自体の歌詞を取得
        // 選択肢として各 URL とページ名、google の歌詞を表示
        // 選択したものをさらに取りに行く
        while (!this.$refs.customWebview) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
        await this.$refs.customWebview.register(
          'domains',
          Object.keys(domainFuncs)
        )
        this.$refs.customWebview.register('formatLyric', formatLyric, false)
        const googleEntity = await this.$refs.customWebview.run(googleFunc)
        this.entities = await this.$refs.customWebview.run(() => {
          return [...document.querySelectorAll('a[data-ved]')]
            .filter((el) => !el.id && !el.className && el.href)
            .filter((el) => domains.some((domain) => el.href.match(domain)))
            .map((el) => ({
              title: el.querySelector('h3')?.innerText,
              href: el.href,
            }))
        })
        if (googleEntity) {
          this.entities.unshift(googleEntity)
        }
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
      this.src = entity.href
      const domain = new URL(entity.href).host
      console.log({ domain, func: domainFuncs[domain] })
      const lyric = formatLyric(
        await this.$refs.customWebview.run(domainFuncs[domain])
      )
      entity.lyric = lyric
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
