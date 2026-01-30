/**
 * ページ優先度アルゴリズム
 * Sitemap URLの重要度を自動判定
 */

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export interface PagePriorityScore {
  url: string
  score: number // 0-100
  tier: 'critical' | 'high' | 'medium' | 'low'
  factors: PriorityFactor[]
}

export interface PriorityFactor {
  name: string
  contribution: number // このファクターがスコアに寄与した点数
  reason: string
}

/**
 * ページ優先度を計算
 */
export function calculatePagePriority(sitemapUrl: SitemapUrl): PagePriorityScore {
  const factors: PriorityFactor[] = []
  let totalScore = 0

  // 1. URL深度スコア (0-30点)
  // 浅いほど重要
  const depthScore = calculateDepthScore(sitemapUrl.loc)
  totalScore += depthScore.contribution
  factors.push(depthScore)

  // 2. Sitemapのpriority属性 (0-20点)
  const sitemapPriorityScore = calculateSitemapPriorityScore(sitemapUrl.priority)
  totalScore += sitemapPriorityScore.contribution
  factors.push(sitemapPriorityScore)

  // 3. lastmod新しさ (0-20点)
  const freshnessScore = calculateFreshnessScore(sitemapUrl.lastmod)
  totalScore += freshnessScore.contribution
  factors.push(freshnessScore)

  // 4. URLパスシグナル (0-20点)
  const pathScore = calculatePathSignalScore(sitemapUrl.loc)
  totalScore += pathScore.contribution
  factors.push(pathScore)

  // 5. changefreq (0-10点)
  const changefreqScore = calculateChangefreqScore(sitemapUrl.changefreq)
  totalScore += changefreqScore.contribution
  factors.push(changefreqScore)

  // Tier分類
  const tier = classifyTier(totalScore)

  return {
    url: sitemapUrl.loc,
    score: Math.min(100, Math.max(0, Math.round(totalScore))),
    tier,
    factors
  }
}

/**
 * URL深度スコア (0-30点)
 */
function calculateDepthScore(url: string): PriorityFactor {
  try {
    const parsed = new URL(url)
    const pathSegments = parsed.pathname.split('/').filter(s => s.length > 0)
    const depth = pathSegments.length

    // 深度0（ルート）= 30点、深度1 = 25点、深度2 = 18点、深度3 = 12点、深度4+ = 5点
    let score: number
    let reason: string

    if (depth === 0) {
      score = 30
      reason = 'ルートページ（最重要）'
    } else if (depth === 1) {
      score = 25
      reason = '第1階層（主要ページ）'
    } else if (depth === 2) {
      score = 18
      reason = '第2階層'
    } else if (depth === 3) {
      score = 12
      reason = '第3階層'
    } else {
      score = 5
      reason = `第${depth}階層（深い）`
    }

    return { name: 'URL深度', contribution: score, reason }
  } catch {
    return { name: 'URL深度', contribution: 10, reason: 'URL解析不可' }
  }
}

/**
 * Sitemapのpriority属性スコア (0-20点)
 */
function calculateSitemapPriorityScore(priority?: number): PriorityFactor {
  if (priority === undefined) {
    return { name: 'sitemap priority', contribution: 10, reason: 'priority未指定（デフォルト）' }
  }

  // priority 0.0-1.0 を 0-20点にマッピング
  const score = Math.round(priority * 20)
  return {
    name: 'sitemap priority',
    contribution: score,
    reason: `priority=${priority}`
  }
}

/**
 * lastmod新しさスコア (0-20点)
 */
function calculateFreshnessScore(lastmod?: string): PriorityFactor {
  if (!lastmod) {
    return { name: '更新日', contribution: 5, reason: 'lastmod未指定' }
  }

  try {
    const date = new Date(lastmod)
    const now = new Date()
    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)

    let score: number
    let reason: string

    if (daysDiff < 7) {
      score = 20
      reason = '1週間以内に更新'
    } else if (daysDiff < 30) {
      score = 16
      reason = '1ヶ月以内に更新'
    } else if (daysDiff < 90) {
      score = 12
      reason = '3ヶ月以内に更新'
    } else if (daysDiff < 180) {
      score = 8
      reason = '6ヶ月以内に更新'
    } else if (daysDiff < 365) {
      score = 5
      reason = '1年以内に更新'
    } else {
      score = 2
      reason = '1年以上更新なし'
    }

    return { name: '更新日', contribution: score, reason }
  } catch {
    return { name: '更新日', contribution: 5, reason: 'lastmod解析不可' }
  }
}

/**
 * URLパスシグナルスコア (0-20点)
 */
function calculatePathSignalScore(url: string): PriorityFactor {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()

    // 重要なパスパターン
    const criticalPatterns = [
      { pattern: /^\/$/, score: 20, reason: 'ホームページ' },
      { pattern: /^\/about\/?$/, score: 18, reason: '会社概要' },
      { pattern: /^\/contact\/?$/, score: 16, reason: 'お問い合わせ' },
      { pattern: /^\/pricing\/?$/, score: 18, reason: '価格ページ' },
      { pattern: /^\/features?\/?$/, score: 16, reason: '機能紹介' },
      { pattern: /^\/products?\/?$/, score: 17, reason: '製品ページ' },
      { pattern: /^\/services?\/?$/, score: 17, reason: 'サービスページ' },
    ]

    // 高優先度パターン
    const highPatterns = [
      { pattern: /\/blog\/?$/, score: 14, reason: 'ブログトップ' },
      { pattern: /\/news\/?$/, score: 14, reason: 'ニューストップ' },
      { pattern: /\/docs?\/?$/, score: 14, reason: 'ドキュメントトップ' },
      { pattern: /\/faq\/?$/, score: 13, reason: 'FAQ' },
      { pattern: /\/help\/?$/, score: 12, reason: 'ヘルプ' },
    ]

    // 低優先度パターン
    const lowPatterns = [
      { pattern: /\/tag\//, score: 4, reason: 'タグページ' },
      { pattern: /\/category\//, score: 5, reason: 'カテゴリページ' },
      { pattern: /\/archive\//, score: 4, reason: 'アーカイブ' },
      { pattern: /\/page\/\d+/, score: 3, reason: 'ページネーション' },
      { pattern: /\/author\//, score: 5, reason: '著者ページ' },
      { pattern: /\/search/, score: 3, reason: '検索結果' },
      { pattern: /\/privacy/, score: 6, reason: 'プライバシーポリシー' },
      { pattern: /\/terms/, score: 6, reason: '利用規約' },
    ]

    // クリティカルパターンをチェック
    for (const { pattern, score, reason } of criticalPatterns) {
      if (pattern.test(path)) {
        return { name: 'URLパス', contribution: score, reason }
      }
    }

    // 高優先度パターンをチェック
    for (const { pattern, score, reason } of highPatterns) {
      if (pattern.test(path)) {
        return { name: 'URLパス', contribution: score, reason }
      }
    }

    // 低優先度パターンをチェック
    for (const { pattern, score, reason } of lowPatterns) {
      if (pattern.test(path)) {
        return { name: 'URLパス', contribution: score, reason }
      }
    }

    // コンテンツページ（ブログ記事など）
    if (/\/blog\/[^/]+/.test(path) || /\/news\/[^/]+/.test(path)) {
      return { name: 'URLパス', contribution: 10, reason: 'コンテンツページ' }
    }

    // 製品/サービス詳細
    if (/\/products?\/[^/]+/.test(path) || /\/services?\/[^/]+/.test(path)) {
      return { name: 'URLパス', contribution: 12, reason: '製品/サービス詳細' }
    }

    // デフォルト
    return { name: 'URLパス', contribution: 8, reason: '一般ページ' }
  } catch {
    return { name: 'URLパス', contribution: 8, reason: 'URL解析不可' }
  }
}

/**
 * changefreqスコア (0-10点)
 */
function calculateChangefreqScore(changefreq?: string): PriorityFactor {
  if (!changefreq) {
    return { name: '更新頻度', contribution: 5, reason: 'changefreq未指定' }
  }

  const scores: Record<string, { score: number; reason: string }> = {
    'always': { score: 10, reason: '常時更新' },
    'hourly': { score: 9, reason: '毎時更新' },
    'daily': { score: 8, reason: '毎日更新' },
    'weekly': { score: 6, reason: '毎週更新' },
    'monthly': { score: 4, reason: '毎月更新' },
    'yearly': { score: 2, reason: '毎年更新' },
    'never': { score: 1, reason: '更新なし' },
  }

  const result = scores[changefreq.toLowerCase()]
  if (result) {
    return { name: '更新頻度', contribution: result.score, reason: result.reason }
  }

  return { name: '更新頻度', contribution: 5, reason: `不明: ${changefreq}` }
}

/**
 * Tier分類
 */
function classifyTier(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 75) return 'critical'
  if (score >= 55) return 'high'
  if (score >= 35) return 'medium'
  return 'low'
}

/**
 * 複数URLを優先度順にソート
 */
export function sortByPriority(urls: SitemapUrl[]): PagePriorityScore[] {
  return urls
    .map(url => calculatePagePriority(url))
    .sort((a, b) => b.score - a.score)
}

/**
 * Tierごとにグループ化
 */
export function groupByTier(urls: SitemapUrl[]): Record<'critical' | 'high' | 'medium' | 'low', PagePriorityScore[]> {
  const sorted = sortByPriority(urls)
  return {
    critical: sorted.filter(p => p.tier === 'critical'),
    high: sorted.filter(p => p.tier === 'high'),
    medium: sorted.filter(p => p.tier === 'medium'),
    low: sorted.filter(p => p.tier === 'low'),
  }
}

/**
 * 自動選択: 上位N件を優先度順に選択
 */
export function selectTopPriority(urls: SitemapUrl[], maxCount: number): PagePriorityScore[] {
  const sorted = sortByPriority(urls)
  return sorted.slice(0, maxCount)
}

/**
 * バランス選択: 各Tierから均等に選択
 */
export function selectBalanced(urls: SitemapUrl[], maxCount: number): PagePriorityScore[] {
  const grouped = groupByTier(urls)
  const result: PagePriorityScore[] = []

  // 優先度の高いTierから順に選択
  const tiers: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low']
  let remaining = maxCount

  for (const tier of tiers) {
    if (remaining <= 0) break

    const tierUrls = grouped[tier]
    const toTake = Math.min(tierUrls.length, Math.ceil(remaining / (tiers.indexOf(tier) + 1)))
    result.push(...tierUrls.slice(0, toTake))
    remaining -= toTake
  }

  return result.slice(0, maxCount)
}

/**
 * Tier表示用ラベルと色
 */
export const TIER_CONFIG = {
  critical: {
    label: '最重要',
    color: '#ef4444', // red-500
    bgColor: '#fee2e2', // red-100
  },
  high: {
    label: '重要',
    color: '#f97316', // orange-500
    bgColor: '#ffedd5', // orange-100
  },
  medium: {
    label: '中',
    color: '#eab308', // yellow-500
    bgColor: '#fef9c3', // yellow-100
  },
  low: {
    label: '低',
    color: '#6b7280', // gray-500
    bgColor: '#f3f4f6', // gray-100
  },
} as const
