/**
 * 動的閾値設定モジュール
 * コンテンツ種別ごとの最適閾値を定義
 */

import type { ContentType, Industry } from './content-classifier.ts'

export interface ThresholdRange {
  min: number
  optimal: number
  max: number
}

export interface ContentTypeThresholds {
  title: ThresholdRange
  metaDescription: ThresholdRange
  wordCount: ThresholdRange
  images: {
    min: number
    optimal: number
    perWords?: number // X文字ごとに1画像
  }
  headings: {
    h1: { min: number; max: number }
    h2Min: number
  }
  internalLinks: ThresholdRange
  externalLinks: ThresholdRange
}

/**
 * コンテンツ種別ごとの閾値設定
 */
export const CONTENT_TYPE_THRESHOLDS: Record<ContentType, ContentTypeThresholds> = {
  'news-article': {
    title: { min: 40, optimal: 55, max: 70 },
    metaDescription: { min: 100, optimal: 130, max: 160 },
    wordCount: { min: 300, optimal: 600, max: 1000 },
    images: { min: 1, optimal: 2, perWords: 300 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 1 },
    internalLinks: { min: 2, optimal: 5, max: 15 },
    externalLinks: { min: 0, optimal: 2, max: 5 }
  },
  'blog-post': {
    title: { min: 30, optimal: 50, max: 60 },
    metaDescription: { min: 120, optimal: 145, max: 160 },
    wordCount: { min: 800, optimal: 1500, max: 3000 },
    images: { min: 2, optimal: 5, perWords: 500 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 3 },
    internalLinks: { min: 3, optimal: 8, max: 20 },
    externalLinks: { min: 1, optimal: 3, max: 10 }
  },
  'product-page': {
    title: { min: 25, optimal: 50, max: 65 },
    metaDescription: { min: 100, optimal: 140, max: 155 },
    wordCount: { min: 200, optimal: 500, max: 1200 },
    images: { min: 3, optimal: 6, perWords: 100 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 2 },
    internalLinks: { min: 5, optimal: 10, max: 30 },
    externalLinks: { min: 0, optimal: 1, max: 3 }
  },
  'landing-page': {
    title: { min: 30, optimal: 50, max: 60 },
    metaDescription: { min: 130, optimal: 150, max: 160 },
    wordCount: { min: 500, optimal: 1000, max: 2000 },
    images: { min: 3, optimal: 8, perWords: 200 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 3 },
    internalLinks: { min: 3, optimal: 6, max: 15 },
    externalLinks: { min: 0, optimal: 0, max: 2 }
  },
  'documentation': {
    title: { min: 30, optimal: 55, max: 70 },
    metaDescription: { min: 100, optimal: 140, max: 160 },
    wordCount: { min: 1500, optimal: 3000, max: 8000 },
    images: { min: 2, optimal: 10, perWords: 500 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 5 },
    internalLinks: { min: 5, optimal: 15, max: 50 },
    externalLinks: { min: 2, optimal: 5, max: 15 }
  },
  'ecommerce-listing': {
    title: { min: 30, optimal: 50, max: 60 },
    metaDescription: { min: 100, optimal: 140, max: 160 },
    wordCount: { min: 100, optimal: 300, max: 800 },
    images: { min: 5, optimal: 20, perWords: 50 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 1 },
    internalLinks: { min: 10, optimal: 30, max: 100 },
    externalLinks: { min: 0, optimal: 0, max: 2 }
  },
  'service-page': {
    title: { min: 30, optimal: 50, max: 60 },
    metaDescription: { min: 120, optimal: 150, max: 160 },
    wordCount: { min: 600, optimal: 1200, max: 2500 },
    images: { min: 2, optimal: 5, perWords: 400 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 3 },
    internalLinks: { min: 4, optimal: 8, max: 20 },
    externalLinks: { min: 0, optimal: 2, max: 5 }
  },
  'about-page': {
    title: { min: 25, optimal: 45, max: 60 },
    metaDescription: { min: 100, optimal: 140, max: 160 },
    wordCount: { min: 400, optimal: 800, max: 1500 },
    images: { min: 1, optimal: 4, perWords: 300 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 2 },
    internalLinks: { min: 3, optimal: 6, max: 15 },
    externalLinks: { min: 1, optimal: 3, max: 8 }
  },
  'faq-page': {
    title: { min: 30, optimal: 50, max: 60 },
    metaDescription: { min: 120, optimal: 150, max: 160 },
    wordCount: { min: 500, optimal: 1500, max: 4000 },
    images: { min: 0, optimal: 2, perWords: 1000 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 5 },
    internalLinks: { min: 3, optimal: 10, max: 30 },
    externalLinks: { min: 1, optimal: 3, max: 10 }
  },
  'generic': {
    title: { min: 30, optimal: 55, max: 60 },
    metaDescription: { min: 100, optimal: 150, max: 160 },
    wordCount: { min: 500, optimal: 1000, max: 2500 },
    images: { min: 1, optimal: 3, perWords: 500 },
    headings: { h1: { min: 1, max: 1 }, h2Min: 2 },
    internalLinks: { min: 3, optimal: 6, max: 20 },
    externalLinks: { min: 1, optimal: 3, max: 8 }
  }
}

/**
 * 業界別の追加調整係数
 */
export const INDUSTRY_ADJUSTMENTS: Record<Industry, Partial<{
  wordCountMultiplier: number
  technicalTermsExpected: boolean
  citationsExpected: boolean
  structuredDataRequired: string[]
}>> = {
  technology: {
    wordCountMultiplier: 1.2,
    technicalTermsExpected: true,
    structuredDataRequired: ['Article', 'HowTo', 'SoftwareApplication']
  },
  healthcare: {
    wordCountMultiplier: 1.3,
    citationsExpected: true,
    structuredDataRequired: ['Article', 'MedicalWebPage']
  },
  finance: {
    wordCountMultiplier: 1.2,
    citationsExpected: true,
    structuredDataRequired: ['Article', 'FinancialProduct']
  },
  ecommerce: {
    wordCountMultiplier: 0.8,
    structuredDataRequired: ['Product', 'Offer', 'AggregateRating']
  },
  education: {
    wordCountMultiplier: 1.3,
    structuredDataRequired: ['Article', 'Course', 'HowTo']
  },
  media: {
    wordCountMultiplier: 0.9,
    structuredDataRequired: ['NewsArticle', 'Article']
  },
  travel: {
    wordCountMultiplier: 1.0,
    structuredDataRequired: ['Place', 'Hotel', 'TouristAttraction']
  },
  'real-estate': {
    wordCountMultiplier: 1.0,
    structuredDataRequired: ['RealEstateListing', 'Place']
  },
  food: {
    wordCountMultiplier: 0.9,
    structuredDataRequired: ['Recipe', 'Restaurant', 'LocalBusiness']
  },
  legal: {
    wordCountMultiplier: 1.4,
    citationsExpected: true,
    structuredDataRequired: ['Article', 'LegalService']
  },
  generic: {}
}

/**
 * コンテンツ種別と業界から閾値を取得
 */
export function getThresholds(
  contentType: ContentType,
  industry: Industry = 'generic'
): ContentTypeThresholds {
  const baseThresholds = { ...CONTENT_TYPE_THRESHOLDS[contentType] }
  const adjustments = INDUSTRY_ADJUSTMENTS[industry]

  // 業界調整を適用
  if (adjustments?.wordCountMultiplier) {
    baseThresholds.wordCount = {
      min: Math.round(baseThresholds.wordCount.min * adjustments.wordCountMultiplier),
      optimal: Math.round(baseThresholds.wordCount.optimal * adjustments.wordCountMultiplier),
      max: Math.round(baseThresholds.wordCount.max * adjustments.wordCountMultiplier)
    }
  }

  return baseThresholds
}

/**
 * スコア計算: 閾値範囲に基づいた動的スコアリング
 */
export function calculateRangeScore(
  value: number,
  range: ThresholdRange,
  invertPenalty: boolean = false
): { score: number; rating: string; suggestion?: string } {
  // 最適値からの距離に基づいてスコア計算
  const { min, optimal, max } = range

  if (value < min) {
    // 最小値未満: 大幅減点
    const ratio = value / min
    const score = Math.max(0, Math.round(40 * ratio))
    return {
      score,
      rating: 'insufficient',
      suggestion: `最低${min}以上を推奨（現在: ${value}）`
    }
  }

  if (value > max) {
    // 最大値超過: 減点（invertPenaltyの場合は軽微）
    const excess = value - max
    const penaltyRatio = invertPenalty ? 0.5 : 1
    const score = Math.max(50, 100 - Math.round(excess / (max * 0.5) * 30 * penaltyRatio))
    return {
      score,
      rating: 'excessive',
      suggestion: `${max}以下を推奨（現在: ${value}）`
    }
  }

  if (value >= min && value <= optimal) {
    // 最小〜最適: 60〜100点
    const ratio = (value - min) / (optimal - min)
    const score = Math.round(60 + 40 * ratio)
    return {
      score,
      rating: value >= optimal * 0.9 ? 'optimal' : 'adequate'
    }
  }

  // 最適〜最大: 80〜100点
  const ratio = 1 - (value - optimal) / (max - optimal)
  const score = Math.round(80 + 20 * ratio)
  return {
    score,
    rating: 'good'
  }
}

/**
 * タイトル長スコア計算
 */
export function scoreTitleLength(length: number, contentType: ContentType): {
  score: number
  rating: string
  suggestion?: string
} {
  const range = CONTENT_TYPE_THRESHOLDS[contentType].title
  return calculateRangeScore(length, range)
}

/**
 * メタディスクリプション長スコア計算
 */
export function scoreMetaLength(length: number, contentType: ContentType): {
  score: number
  rating: string
  suggestion?: string
} {
  const range = CONTENT_TYPE_THRESHOLDS[contentType].metaDescription
  return calculateRangeScore(length, range)
}

/**
 * 文字数スコア計算
 */
export function scoreWordCount(
  wordCount: number,
  contentType: ContentType,
  industry: Industry = 'generic'
): {
  score: number
  rating: string
  suggestion?: string
} {
  const thresholds = getThresholds(contentType, industry)
  return calculateRangeScore(wordCount, thresholds.wordCount, true)
}
