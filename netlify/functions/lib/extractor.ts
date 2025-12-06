import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export function extractMainContent(html: string): string {
  const dom = new JSDOM(html)
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  if (!article || !article.textContent) {
    throw new Error('Failed to extract content from page')
  }

  return article.textContent.trim()
}

export function extractStructuralInfo(html: string) {
  const dom = new JSDOM(html)
  const doc = dom.window.document

  // 見出し構造の抽出
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  const headingStructure = headings.map(h => ({
    level: parseInt(h.tagName[1]),
    text: h.textContent?.trim() || ''
  }))

  // リスト要素のカウント
  const lists = doc.querySelectorAll('ul, ol')
  const listItems = doc.querySelectorAll('li')

  // 段落のカウントと平均長
  const paragraphs = Array.from(doc.querySelectorAll('p'))
  const paragraphLengths = paragraphs.map(p => p.textContent?.length || 0)
  const avgParagraphLength = paragraphLengths.length > 0
    ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length
    : 0

  return {
    headingCount: headings.length,
    headingStructure,
    listCount: lists.length,
    listItemCount: listItems.length,
    paragraphCount: paragraphs.length,
    avgParagraphLength
  }
}
