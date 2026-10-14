import { describe, expect, it } from 'vitest'
import { contentService } from '../../server/services/content.service'

const { sanitizeArticleHtml, readingMinutes, plainText } = contentService

describe('sanitizeArticleHtml', () => {
  it('removes scripts, event handlers and javascript links', () => {
    const html = '<p onclick="steal()">Hi <a href="javascript:alert(1)">x</a></p><script>alert(1)</script><img src="https://cdn.example.com/a.webp" onerror="x()">'
    const clean = sanitizeArticleHtml(html)
    expect(clean).not.toMatch(/script|onclick|onerror|javascript:/)
    expect(clean).toContain('<img src="https://cdn.example.com/a.webp"')
  })

  it('opens external links safely and keeps internal links untouched', () => {
    expect(sanitizeArticleHtml('<a href="https://nuxt.com">Nuxt</a>')).toBe('<a href="https://nuxt.com" target="_blank" rel="noopener noreferrer">Nuxt</a>')
    expect(sanitizeArticleHtml('<a href="/articles" target="_blank">All</a>')).toBe('<a href="/articles">All</a>')
  })

  it('downgrades h1 to h2', () => {
    expect(sanitizeArticleHtml('<h1>Title</h1>')).toBe('<h2>Title</h2>')
  })

  it('keeps YouTube embeds on the no-cookie domain and drops other iframes', () => {
    const youtube = sanitizeArticleHtml('<div data-youtube-video=""><iframe src="https://www.youtube.com/embed/abc123"></iframe></div>')
    expect(youtube).toContain('src="https://www.youtube-nocookie.com/embed/abc123"')
    expect(sanitizeArticleHtml('<iframe src="https://evil.example.com/x"></iframe>')).toBe('')
  })

  it('keeps code block language classes only', () => {
    expect(sanitizeArticleHtml('<pre class="language-ts evil"><code class="language-ts">let a</code></pre>'))
      .toBe('<pre class="language-ts"><code class="language-ts">let a</code></pre>')
  })
})

describe('readingMinutes', () => {
  it('rounds to whole minutes with a minimum of one', () => {
    expect(readingMinutes('<p>short</p>')).toBe(1)
    expect(readingMinutes(`<p>${'word '.repeat(660)}</p>`)).toBe(3)
  })

  it('ignores markup when counting', () => {
    expect(plainText('<h2>A</h2><p>b <strong>c</strong></p>')).toBe('A b c')
  })
})
