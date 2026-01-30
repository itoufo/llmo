import { SEOAnalysisResult } from './types.ts'

export function analyzeSEO(html: string): SEOAnalysisResult {
  // タイトルタグの分析
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const title = {
    exists: !!titleMatch,
    content: titleMatch ? titleMatch[1] : '',
    length: titleMatch ? titleMatch[1].length : 0,
    score: 0,
    suggestions: [] as string[]
  }

  // スコア計算
  if (!title.exists) {
    title.score = 0
    title.suggestions.push('タイトルタグを設定してください')
  } else if (title.length < 30) {
    title.score = 60
    title.suggestions.push('タイトルが短すぎます（推奨: 30-60文字）')
  } else if (title.length > 60) {
    title.score = 70
    title.suggestions.push('タイトルが長すぎます（推奨: 30-60文字）')
  } else {
    title.score = 100
  }

  // メタディスクリプションの分析
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
  const metaDesc = {
    exists: !!metaDescMatch,
    content: metaDescMatch ? metaDescMatch[1] : '',
    length: metaDescMatch ? metaDescMatch[1].length : 0
  }

  const metaKeywordsMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']*)["']/i)
  const metaKeywords = {
    exists: !!metaKeywordsMatch,
    content: metaKeywordsMatch ? metaKeywordsMatch[1] : ''
  }

  const meta = {
    description: metaDesc,
    keywords: metaKeywords,
    score: 0,
    suggestions: [] as string[]
  }

  // メタスコア計算
  if (!meta.description.exists) {
    meta.score = 0
    meta.suggestions.push('メタディスクリプションを設定してください')
  } else if (meta.description.length < 80) {
    meta.score = 60
    meta.suggestions.push('メタディスクリプションが短すぎます（推奨: 80-160文字）')
  } else if (meta.description.length > 160) {
    meta.score = 70
    meta.suggestions.push('メタディスクリプションが長すぎます（推奨: 80-160文字）')
  } else {
    meta.score = 100
  }

  // 見出しタグの分析
  const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || []
  const h2Matches = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || []
  const h3Matches = html.match(/<h3[^>]*>[\s\S]*?<\/h3>/gi) || []

  const headings = {
    h1: {
      count: h1Matches.length,
      content: h1Matches.map(h => h.replace(/<[^>]*>/g, '').trim())
    },
    h2: {
      count: h2Matches.length,
      content: h2Matches.map(h => h.replace(/<[^>]*>/g, '').trim())
    },
    h3: {
      count: h3Matches.length,
      content: h3Matches.map(h => h.replace(/<[^>]*>/g, '').trim())
    },
    structure: '',
    score: 0,
    suggestions: [] as string[]
  }

  // 見出し構造の評価
  if (headings.h1.count === 0) {
    headings.score = 0
    headings.suggestions.push('H1タグを設定してください')
  } else if (headings.h1.count > 1) {
    headings.score = 70
    headings.suggestions.push('H1タグは1つだけにしてください')
  } else {
    headings.score = 100
    if (headings.h2.count === 0) {
      headings.score = 80
      headings.suggestions.push('H2タグを使用してコンテンツを構造化してください')
    }
  }

  headings.structure = `H1(${headings.h1.count}) → H2(${headings.h2.count}) → H3(${headings.h3.count})`

  // 画像の分析
  const imgMatches = html.match(/<img[^>]*>/gi) || []
  let withAlt = 0
  let withTitle = 0
  
  imgMatches.forEach(img => {
    if (/alt=["'][^"']+["']/i.test(img)) withAlt++
    if (/title=["'][^"']+["']/i.test(img)) withTitle++
  })

  const images = {
    count: imgMatches.length,
    withAlt,
    withTitle,
    score: 0,
    suggestions: [] as string[]
  }

  // 画像スコア計算
  if (images.count === 0) {
    images.score = 50
    images.suggestions.push('画像を追加してコンテンツを豊かにしてください')
  } else {
    const altRatio = images.withAlt / images.count
    if (altRatio === 1) {
      images.score = 100
    } else if (altRatio >= 0.8) {
      images.score = 80
      images.suggestions.push(`${images.count - images.withAlt}個の画像にalt属性を追加してください`)
    } else {
      images.score = 50
      images.suggestions.push('すべての画像にalt属性を設定してください')
    }
  }

  // リンクの分析
  const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || []
  let internal = 0
  let external = 0
  
  linkMatches.forEach(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i)
    if (hrefMatch) {
      const href = hrefMatch[1]
      if (href.startsWith('http://') || href.startsWith('https://')) {
        external++
      } else if (!href.startsWith('mailto:') && !href.startsWith('tel:')) {
        internal++
      }
    }
  })

  const links = {
    internal,
    external,
    score: 0,
    suggestions: [] as string[]
  }

  // リンクスコア計算
  if (internal === 0 && external === 0) {
    links.score = 0
    links.suggestions.push('内部リンクと外部リンクを適切に配置してください')
  } else if (internal === 0) {
    links.score = 50
    links.suggestions.push('内部リンクを追加してサイト内導線を強化してください')
  } else if (external === 0) {
    links.score = 70
    links.suggestions.push('信頼できる外部リンクを追加してください')
  } else {
    links.score = 100
  }

  // キーワード密度の分析（簡易版）
  const textContent = html.replace(/<[^>]+>/g, ' ').toLowerCase()
  const words = textContent.split(/\s+/).filter(word => word.length > 2)
  const wordCount: Record<string, number> = {}
  
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  const sortedWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  const keywords = {
    density: Object.fromEntries(sortedWords),
    score: 80, // 簡易評価
    suggestions: [] as string[]
  }

  // モバイル対応の確認
  const viewportMatch = html.match(/<meta\s+name=["']viewport["'][^>]*>/i)
  const mobile = {
    viewport: !!viewportMatch,
    responsive: !!viewportMatch, // 簡易判定
    score: 0,
    suggestions: [] as string[]
  }

  if (!mobile.viewport) {
    mobile.score = 0
    mobile.suggestions.push('viewportメタタグを設定してモバイル対応してください')
  } else {
    mobile.score = 100
  }

  // パフォーマンスの簡易評価
  const htmlSize = new TextEncoder().encode(html).length
  const estimatedLoadTime = htmlSize / (50 * 1024) // 50KB/秒と仮定
  
  const performance = {
    htmlSize,
    estimatedLoadTime,
    score: 0,
    suggestions: [] as string[]
  }

  if (htmlSize < 100 * 1024) {
    performance.score = 100
  } else if (htmlSize < 300 * 1024) {
    performance.score = 70
    performance.suggestions.push('HTMLサイズを削減してパフォーマンスを改善してください')
  } else {
    performance.score = 40
    performance.suggestions.push('HTMLサイズが大きすぎます。コンテンツを最適化してください')
  }

  return {
    title,
    meta,
    headings,
    images,
    links,
    keywords,
    mobile,
    performance,
    suggestions: []
  }
}