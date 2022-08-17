const fetch = require('node-fetch')

const formatLyric = (rawLyric) =>
  rawLyric
    .replaceAll(/\n+/g, '\n')
    .replaceAll(/^\s+/g, '')
    .replaceAll(/　/g, ' ')

const getInnerTextAndNewLine = (el) => {
  const clonedEl = el.cloneNode(true)
  clonedEl.querySelectorAll('br').forEach((br) => {
    const n = document.createElement('div')
    n.innerText = '\\n'
    br.parentElement.insertBefore(n, br)
  })
  return clonedEl.innerText.replaceAll('\\n', '\n')
}

const domainFuncs = {
  'www.uta-net.com': async (document) => {
    console.log({ document })
    return getInnerTextAndNewLine(document.getElementById('kashi_area'))
  },
  'utaten.com': async (document) => {
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
  'www.utamap.com': async (document) => {
    return getInnerTextAndNewLine(
      document.querySelector('td.noprint.kasi_honbun')
    )
  },
  'j-lyric.net': async (document) => {
    return getInnerTextAndNewLine(document.getElementById('Lyric'))
  },
  'petitlyrics.com': async (document) => {
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

const googleFunc = async (document) => {
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

  return { lyricFunc: () => lyric, title: `${name} ${artist}` }
}

const searchLyricSites = async (title, artist) => {
  const query = [title, artist ?? '', '歌詞']
    .join(' ')
    .replaceAll(' ', '+')
    .replaceAll('&', ' ')
  const searchUrl = `https://www.google.com/search?q=${query}`
  const rawHtml = await fetch(searchUrl).then((r) => r.text())
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html')
  const googleEntity = await googleFunc(doc)
  console.log({ rawHtml })
  const entities = [...doc.querySelectorAll('a')]
    .filter((el) => !el.id && !el.className && el.href)
    .map((el) => [
      el,
      Object.keys(domainFuncs).find((domain) => el.href.match(domain)),
    ])
    .filter(([, domain]) => domain)
    .map(([el, domain]) => ({
      title: el.querySelector('h3')?.innerText,
      href: decodeURIComponent(el.href.match(/(?<=\?q=).+?(?=&)/)[0] ?? ''),
      domain: domain,
    }))
  if (googleEntity) {
    entities.unshift(googleEntity)
  }
  return entities
}

const getLyric = async (domain, href) => {
  console.log({ href })
  const rawHtml = await fetch(href).then((r) => r.text())
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html')
  console.log({ rawHtml })
  return formatLyric(await domainFuncs[domain](doc))
}

module.exports = {
  searchLyricSites,
  getLyric,
}
