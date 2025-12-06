import * as cheerio from 'cheerio'

export function extractMainContent(html: string): string {
  console.log(`[extractor] HTML length: ${html.length}`)
  console.log(`[extractor] HTML preview: ${html.slice(0, 500)}`)

  const $ = cheerio.load(html)

  // 不要な要素を削除
  $('script').remove()
  $('style').remove()
  $('nav').remove()
  $('header').remove()
  $('footer').remove()
  $('aside').remove()
  $('iframe').remove()
  $('noscript').remove()
  $('svg').remove()
  $('form').remove()
  $('button').remove()
  $('input').remove()
  $('[role="navigation"]').remove()
  $('[role="banner"]').remove()
  $('[role="contentinfo"]').remove()
  $('[aria-hidden="true"]').remove()
  $('.nav, .navbar, .menu, .sidebar, .footer, .header, .advertisement, .ad, .ads').remove()
  $('#nav, #navbar, #menu, #sidebar, #footer, #header, #comments').remove()

  // メインコンテンツを優先的に取得（優先度順）
  const selectors = [
    'article',
    '[role="main"]',
    'main',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '#content',
    '.post',
    '.article',
    'body'
  ]

  let content = ''
  let usedSelector = ''

  for (const selector of selectors) {
    const el = $(selector)
    if (el.length > 0) {
      // テキストを取得
      const text = el.text()
      const cleanedText = text.replace(/\s+/g, ' ').trim()
      console.log(`[extractor] Selector "${selector}" found ${el.length} elements, text length: ${cleanedText.length}`)

      if (cleanedText.length >= 30) {
        content = cleanedText
        usedSelector = selector
        break
      }
    }
  }

  // フォールバック: 全ての p タグのテキストを結合
  if (!content || content.length < 30) {
    console.log('[extractor] Falling back to p tags')
    const paragraphs: string[] = []
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 0) {
        paragraphs.push(text)
      }
    })
    content = paragraphs.join(' ')
    usedSelector = 'p tags fallback'
  }

  // 最終フォールバック: body全体のテキスト
  if (!content || content.length < 30) {
    console.log('[extractor] Falling back to body text')
    content = $('body').text().replace(/\s+/g, ' ').trim()
    usedSelector = 'body fallback'
  }

  // 最終最終フォールバック: HTML全体からタグを除去
  if (!content || content.length < 30) {
    console.log('[extractor] Falling back to raw HTML strip')
    content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    usedSelector = 'raw HTML strip'
  }

  console.log(`[extractor] Used selector: ${usedSelector}`)
  console.log(`[extractor] Final content length: ${content.length}`)
  console.log(`[extractor] Content preview: ${content.slice(0, 200)}`)

  if (!content || content.length < 30) {
    throw new Error('Failed to extract content from page (content too short or empty). This may be a JavaScript-rendered page.')
  }

  return content
}

export function extractStructuralInfo(html: string) {
  const $ = cheerio.load(html)

  // 見出し構造の抽出
  const headingStructure: { level: number; text: string }[] = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tagName = $(el).prop('tagName') || ''
    headingStructure.push({
      level: parseInt(tagName[1]) || 0,
      text: $(el).text().trim()
    })
  })

  // リスト要素のカウント
  const listCount = $('ul, ol').length
  const listItemCount = $('li').length

  // 段落のカウントと平均長
  const paragraphs = $('p')
  let totalLength = 0
  paragraphs.each((_, el) => {
    totalLength += $(el).text().length
  })
  const avgParagraphLength = paragraphs.length > 0
    ? totalLength / paragraphs.length
    : 0

  return {
    headingCount: headingStructure.length,
    headingStructure,
    listCount,
    listItemCount,
    paragraphCount: paragraphs.length,
    avgParagraphLength
  }
}
