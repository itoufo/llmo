/**
 * コンテンツ種別判定モジュール
 * URLパターン、メタタグ、コンテンツ構造からコンテンツ種別を自動判定
 */

export type ContentType =
  | 'news-article'      // ニュース記事（短め、タイムリー）
  | 'blog-post'         // ブログ記事（中程度）
  | 'product-page'      // 商品ページ（構造化データ重視）
  | 'landing-page'      // ランディングページ（コンバージョン重視）
  | 'documentation'     // ドキュメント（包括的）
  | 'ecommerce-listing' // EC一覧ページ
  | 'service-page'      // サービス紹介ページ
  | 'about-page'        // 会社概要・自己紹介
  | 'faq-page'          // FAQページ
  | 'generic'           // 汎用（判定不能）

export type Industry =
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'ecommerce'
  | 'education'
  | 'media'
  | 'travel'
  | 'real-estate'
  | 'food'
  | 'legal'
  | 'generic'

export interface ContentClassification {
  type: ContentType
  industry: Industry
  confidence: number // 0-1
  signals: string[]  // 判定根拠
}

interface ClassificationInput {
  url: string
  title?: string
  metaDescription?: string
  ogType?: string
  schemaTypes?: string[]
  h1Content?: string[]
  wordCount?: number
  hasDateline?: boolean
  hasPriceInfo?: boolean
  hasAuthorInfo?: boolean
  linkCount?: number
  imageCount?: number
}

/**
 * コンテンツ種別を判定
 */
export function classifyContent(input: ClassificationInput): ContentClassification {
  const signals: string[] = []
  const scores: Record<ContentType, number> = {
    'news-article': 0,
    'blog-post': 0,
    'product-page': 0,
    'landing-page': 0,
    'documentation': 0,
    'ecommerce-listing': 0,
    'service-page': 0,
    'about-page': 0,
    'faq-page': 0,
    'generic': 10 // デフォルトスコア
  }

  const url = input.url.toLowerCase()
  const path = new URL(url).pathname.toLowerCase()

  // 1. URLパターンによる判定
  if (/\/(news|article|press|release)\//.test(path)) {
    scores['news-article'] += 30
    signals.push('URL contains news/article pattern')
  }
  if (/\/(blog|post|entry|journal)\//.test(path)) {
    scores['blog-post'] += 30
    signals.push('URL contains blog pattern')
  }
  if (/\/(product|item|goods|shop)\//.test(path) || /\/p\//.test(path)) {
    scores['product-page'] += 30
    signals.push('URL contains product pattern')
  }
  if (/\/(lp|landing|campaign|promo)\//.test(path)) {
    scores['landing-page'] += 30
    signals.push('URL contains landing page pattern')
  }
  if (/\/(docs|documentation|guide|manual|reference|api)\//.test(path)) {
    scores['documentation'] += 30
    signals.push('URL contains documentation pattern')
  }
  if (/\/(category|collection|search|list)\//.test(path)) {
    scores['ecommerce-listing'] += 25
    signals.push('URL contains listing pattern')
  }
  if (/\/(service|solution|offering)\//.test(path)) {
    scores['service-page'] += 25
    signals.push('URL contains service pattern')
  }
  if (/\/(about|company|team|who-we-are)/.test(path)) {
    scores['about-page'] += 35
    signals.push('URL contains about pattern')
  }
  if (/\/(faq|help|support|qa|question)/.test(path)) {
    scores['faq-page'] += 35
    signals.push('URL contains FAQ pattern')
  }

  // 2. Open Graphタイプによる判定
  if (input.ogType) {
    const ogType = input.ogType.toLowerCase()
    if (ogType === 'article') {
      scores['news-article'] += 15
      scores['blog-post'] += 15
      signals.push('OG type: article')
    }
    if (ogType === 'product') {
      scores['product-page'] += 25
      signals.push('OG type: product')
    }
    if (ogType === 'website') {
      scores['landing-page'] += 5
      signals.push('OG type: website')
    }
  }

  // 3. Schema.orgタイプによる判定
  if (input.schemaTypes?.length) {
    for (const schema of input.schemaTypes) {
      const s = schema.toLowerCase()
      if (s.includes('newsarticle') || s.includes('reportagenewsarticle')) {
        scores['news-article'] += 25
        signals.push(`Schema: ${schema}`)
      }
      if (s.includes('blogposting') || s.includes('article')) {
        scores['blog-post'] += 20
        signals.push(`Schema: ${schema}`)
      }
      if (s.includes('product') || s.includes('offer')) {
        scores['product-page'] += 25
        signals.push(`Schema: ${schema}`)
      }
      if (s.includes('faqpage') || s.includes('question')) {
        scores['faq-page'] += 30
        signals.push(`Schema: ${schema}`)
      }
      if (s.includes('howto') || s.includes('technicalarticle')) {
        scores['documentation'] += 20
        signals.push(`Schema: ${schema}`)
      }
      if (s.includes('organization') || s.includes('localbusiness')) {
        scores['about-page'] += 15
        signals.push(`Schema: ${schema}`)
      }
    }
  }

  // 4. コンテンツ特徴による判定
  if (input.hasDateline) {
    scores['news-article'] += 15
    signals.push('Has dateline')
  }
  if (input.hasPriceInfo) {
    scores['product-page'] += 20
    scores['ecommerce-listing'] += 15
    signals.push('Has price information')
  }
  if (input.hasAuthorInfo) {
    scores['blog-post'] += 10
    scores['news-article'] += 10
    signals.push('Has author information')
  }

  // 5. 文字数による判定
  if (input.wordCount) {
    if (input.wordCount < 500) {
      scores['product-page'] += 10
      scores['landing-page'] += 10
      signals.push(`Short content (${input.wordCount} words)`)
    } else if (input.wordCount >= 500 && input.wordCount < 1500) {
      scores['blog-post'] += 10
      scores['news-article'] += 10
      signals.push(`Medium content (${input.wordCount} words)`)
    } else if (input.wordCount >= 1500) {
      scores['documentation'] += 15
      scores['blog-post'] += 5
      signals.push(`Long content (${input.wordCount} words)`)
    }
  }

  // 6. H1コンテンツによる判定
  if (input.h1Content?.length) {
    const h1Text = input.h1Content.join(' ').toLowerCase()
    if (/how to|guide|tutorial|step|方法|ガイド|チュートリアル/.test(h1Text)) {
      scores['documentation'] += 15
      scores['blog-post'] += 10
      signals.push('H1 contains how-to keywords')
    }
    if (/buy|price|shop|購入|価格|ショップ/.test(h1Text)) {
      scores['product-page'] += 15
      signals.push('H1 contains purchase keywords')
    }
    if (/faq|question|よくある質問/.test(h1Text)) {
      scores['faq-page'] += 20
      signals.push('H1 contains FAQ keywords')
    }
  }

  // 最高スコアのタイプを選択
  let maxScore = 0
  let bestType: ContentType = 'generic'
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      bestType = type as ContentType
    }
  }

  // 信頼度計算（最高スコアと2番目のスコアの差）
  const sortedScores = Object.values(scores).sort((a, b) => b - a)
  const confidence = Math.min(1, (sortedScores[0] - sortedScores[1]) / 50 + 0.3)

  // 業界判定
  const industry = classifyIndustry(input)

  return {
    type: bestType,
    industry: industry.type,
    confidence: Math.round(confidence * 100) / 100,
    signals: [...signals, ...industry.signals]
  }
}

/**
 * 業界を判定
 */
function classifyIndustry(input: ClassificationInput): { type: Industry; signals: string[] } {
  const signals: string[] = []
  const url = input.url.toLowerCase()
  const allText = [
    input.title || '',
    input.metaDescription || '',
    input.h1Content?.join(' ') || ''
  ].join(' ').toLowerCase()

  const industryPatterns: Record<Industry, RegExp[]> = {
    technology: [/tech|software|app|ai|machine learning|cloud|api|developer|programming|code/],
    healthcare: [/health|medical|doctor|patient|hospital|clinic|治療|病院|医療/],
    finance: [/bank|finance|invest|money|loan|credit|保険|金融|投資/],
    ecommerce: [/shop|store|buy|cart|checkout|shipping|購入|カート|送料/],
    education: [/learn|course|school|university|student|教育|学習|スクール/],
    media: [/news|media|magazine|publish|journalist|ニュース|メディア/],
    travel: [/travel|hotel|flight|booking|trip|旅行|ホテル|予約/],
    'real-estate': [/real estate|property|house|apartment|rent|不動産|物件|賃貸/],
    food: [/restaurant|food|recipe|menu|レストラン|レシピ|料理/],
    legal: [/law|legal|attorney|lawyer|弁護士|法律|法務/],
    generic: []
  }

  for (const [industry, patterns] of Object.entries(industryPatterns)) {
    if (industry === 'generic') continue
    for (const pattern of patterns) {
      if (pattern.test(url) || pattern.test(allText)) {
        signals.push(`Industry signal: ${industry}`)
        return { type: industry as Industry, signals }
      }
    }
  }

  return { type: 'generic', signals: [] }
}

/**
 * HTMLからコンテンツ特徴を抽出
 */
export function extractContentFeatures(html: string, url: string): ClassificationInput {
  const input: ClassificationInput = { url }

  // タイトル抽出
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    input.title = titleMatch[1].trim()
  }

  // メタディスクリプション
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (metaDescMatch) {
    input.metaDescription = metaDescMatch[1].trim()
  }

  // OGタイプ
  const ogTypeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i)
  if (ogTypeMatch) {
    input.ogType = ogTypeMatch[1].trim()
  }

  // Schema.orgタイプ
  const schemaMatches = html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)
  input.schemaTypes = [...schemaMatches].map(m => m[1])

  // H1コンテンツ
  const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)
  input.h1Content = [...h1Matches].map(m => m[1].trim())

  // 文字数（HTMLタグ除去後）
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  input.wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length

  // 日付情報の有無
  input.hasDateline = /<time/i.test(html) ||
    /datetime=["'][^"']+["']/i.test(html) ||
    /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(html)

  // 価格情報の有無
  input.hasPriceInfo = /[¥$€£]\s*[\d,]+/.test(html) ||
    /price|価格|料金/i.test(html)

  // 著者情報の有無
  input.hasAuthorInfo = /author|written by|posted by|著者|執筆者/i.test(html) ||
    /<meta[^>]*name=["']author["']/i.test(html)

  // リンク数
  input.linkCount = (html.match(/<a\s/gi) || []).length

  // 画像数
  input.imageCount = (html.match(/<img\s/gi) || []).length

  return input
}
