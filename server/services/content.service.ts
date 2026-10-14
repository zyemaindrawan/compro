import sanitizeHtml from 'sanitize-html'

const WORDS_PER_MINUTE = 220
const YOUTUBE_EMBED = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]+(\?[\w=&-]*)?$/

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre', 'blockquote',
    'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col', 'div', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    code: ['class'],
    pre: ['class'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    col: ['style'],
    div: ['data-youtube-video'],
    iframe: ['src', 'width', 'height', 'allowfullscreen', 'title', 'loading'],
  },
  allowedClasses: {
    code: [/^language-[\w-]+$/],
    pre: [/^language-[\w-]+$/],
  },
  allowedStyles: {
    col: { 'min-width': [/^\d+px$/], 'width': [/^\d+px$/] },
  },
  allowedSchemes: ['https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['https', 'http'] },
  allowProtocolRelative: false,
  exclusiveFilter: frame => frame.tag === 'iframe' && !YOUTUBE_EMBED.test(frame.attribs.src ?? ''),
  transformTags: {
    h1: 'h2',
    a: (tagName, attribs) => {
      const href = attribs.href ?? ''
      const external = /^https?:\/\//i.test(href)
      return {
        tagName,
        attribs: external
          ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
          : { href, ...(attribs.title ? { title: attribs.title } : {}) },
      }
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy', decoding: 'async', alt: attribs.alt ?? '' },
    }),
    iframe: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        src: (attribs.src ?? '').replace('https://www.youtube.com/', 'https://www.youtube-nocookie.com/'),
        loading: 'lazy',
        title: attribs.title || 'Embedded video',
      },
    }),
  },
}

function sanitizeArticleHtml(html: string) {
  return sanitizeHtml(html, options).trim()
}

const BLOCK_BOUNDARY = /<\/(p|h[1-6]|li|blockquote|pre|td|th|figcaption|div)>|<br\s*\/?>/gi

function plainText(html: string) {
  return sanitizeHtml(html.replace(BLOCK_BOUNDARY, ' '), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim()
}

function readingMinutes(html: string) {
  const words = plainText(html).split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export const contentService = {
  sanitizeArticleHtml,
  plainText,
  readingMinutes,
}
