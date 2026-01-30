/**
 * ベンチマークサービス
 * 業界・コンテンツ種別ごとのパーセンタイル算出と比較
 */

import { ContentType } from './content-classifier.ts'

export interface BenchmarkData {
  industry: string
  contentType: ContentType
  metric: string
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  sampleSize: number
  lastUpdated: string
}

export interface BenchmarkComparison {
  metric: string
  score: number
  percentile: number
  interpretation: BenchmarkInterpretation
  industryAvg: number
  gap: number
  improvementPotential: number
}

export type BenchmarkInterpretation =
  | 'top-10'      // 上位10%
  | 'top-25'      // 上位25%
  | 'above-avg'   // 平均以上
  | 'average'     // 平均付近
  | 'below-avg'   // 平均以下
  | 'bottom-25'   // 下位25%
  | 'bottom-10'   // 下位10%

export interface BenchmarkReport {
  industry: string
  contentType: ContentType
  overallPercentile: number
  overallInterpretation: BenchmarkInterpretation
  comparisons: BenchmarkComparison[]
  strengths: string[]
  weaknesses: string[]
  quickWinMetrics: string[]
  summaryText: string
}

// デフォルトベンチマークデータ（初期値）
const DEFAULT_BENCHMARKS: BenchmarkData[] = [
  // 一般的なWebサイト
  { industry: 'general', contentType: 'landing-page', metric: 'overall', p10: 35, p25: 45, p50: 58, p75: 72, p90: 85, sampleSize: 1000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'landing-page', metric: 'aiCitation', p10: 30, p25: 42, p50: 55, p75: 70, p90: 82, sampleSize: 1000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'landing-page', metric: 'questionFit', p10: 32, p25: 44, p50: 56, p75: 68, p90: 80, sampleSize: 1000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'landing-page', metric: 'coverage', p10: 35, p25: 48, p50: 60, p75: 73, p90: 85, sampleSize: 1000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'landing-page', metric: 'structure', p10: 40, p25: 52, p50: 65, p75: 78, p90: 88, sampleSize: 1000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'landing-page', metric: 'eeat', p10: 25, p25: 38, p50: 50, p75: 65, p90: 78, sampleSize: 1000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'landing-page', metric: 'seoOverall', p10: 38, p25: 50, p50: 62, p75: 75, p90: 86, sampleSize: 1000, lastUpdated: '2025-01-01' },

  // ブログ記事
  { industry: 'general', contentType: 'blog-post', metric: 'overall', p10: 32, p25: 42, p50: 55, p75: 70, p90: 82, sampleSize: 2000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'blog-post', metric: 'aiCitation', p10: 35, p25: 48, p50: 60, p75: 75, p90: 85, sampleSize: 2000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'blog-post', metric: 'questionFit', p10: 38, p25: 50, p50: 62, p75: 76, p90: 88, sampleSize: 2000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'blog-post', metric: 'coverage', p10: 30, p25: 42, p50: 55, p75: 68, p90: 80, sampleSize: 2000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'blog-post', metric: 'structure', p10: 35, p25: 48, p50: 60, p75: 74, p90: 85, sampleSize: 2000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'blog-post', metric: 'eeat', p10: 20, p25: 32, p50: 45, p75: 60, p90: 75, sampleSize: 2000, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'blog-post', metric: 'seoOverall', p10: 35, p25: 48, p50: 60, p75: 73, p90: 84, sampleSize: 2000, lastUpdated: '2025-01-01' },

  // 製品ページ
  { industry: 'general', contentType: 'product-page', metric: 'overall', p10: 38, p25: 50, p50: 62, p75: 75, p90: 87, sampleSize: 1500, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'product-page', metric: 'aiCitation', p10: 28, p25: 40, p50: 52, p75: 66, p90: 78, sampleSize: 1500, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'product-page', metric: 'questionFit', p10: 35, p25: 48, p50: 60, p75: 72, p90: 83, sampleSize: 1500, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'product-page', metric: 'coverage', p10: 40, p25: 52, p50: 65, p75: 78, p90: 88, sampleSize: 1500, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'product-page', metric: 'structure', p10: 45, p25: 58, p50: 70, p75: 82, p90: 92, sampleSize: 1500, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'product-page', metric: 'eeat', p10: 30, p25: 42, p50: 55, p75: 68, p90: 80, sampleSize: 1500, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'product-page', metric: 'seoOverall', p10: 42, p25: 55, p50: 68, p75: 80, p90: 90, sampleSize: 1500, lastUpdated: '2025-01-01' },

  // ドキュメント
  { industry: 'general', contentType: 'documentation', metric: 'overall', p10: 40, p25: 52, p50: 65, p75: 78, p90: 88, sampleSize: 800, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'documentation', metric: 'aiCitation', p10: 45, p25: 58, p50: 70, p75: 82, p90: 92, sampleSize: 800, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'documentation', metric: 'questionFit', p10: 42, p25: 55, p50: 68, p75: 80, p90: 90, sampleSize: 800, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'documentation', metric: 'coverage', p10: 48, p25: 60, p50: 72, p75: 84, p90: 93, sampleSize: 800, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'documentation', metric: 'structure', p10: 50, p25: 62, p50: 75, p75: 86, p90: 94, sampleSize: 800, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'documentation', metric: 'eeat', p10: 40, p25: 52, p50: 65, p75: 78, p90: 88, sampleSize: 800, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'documentation', metric: 'seoOverall', p10: 38, p25: 50, p50: 62, p75: 75, p90: 85, sampleSize: 800, lastUpdated: '2025-01-01' },

  // ニュース記事
  { industry: 'general', contentType: 'news-article', metric: 'overall', p10: 35, p25: 48, p50: 60, p75: 72, p90: 83, sampleSize: 1200, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'news-article', metric: 'aiCitation', p10: 40, p25: 52, p50: 65, p75: 78, p90: 88, sampleSize: 1200, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'news-article', metric: 'questionFit', p10: 35, p25: 48, p50: 60, p75: 73, p90: 84, sampleSize: 1200, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'news-article', metric: 'coverage', p10: 32, p25: 45, p50: 58, p75: 70, p90: 82, sampleSize: 1200, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'news-article', metric: 'structure', p10: 38, p25: 50, p50: 62, p75: 75, p90: 86, sampleSize: 1200, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'news-article', metric: 'eeat', p10: 42, p25: 55, p50: 68, p75: 80, p90: 90, sampleSize: 1200, lastUpdated: '2025-01-01' },
  { industry: 'general', contentType: 'news-article', metric: 'seoOverall', p10: 35, p25: 48, p50: 60, p75: 72, p90: 83, sampleSize: 1200, lastUpdated: '2025-01-01' },
]

// メトリクス名の日本語ラベル
const METRIC_LABELS: Record<string, string> = {
  overall: '総合スコア',
  aiCitation: 'AI引用適性',
  questionFit: '質問適合',
  coverage: 'カバレッジ',
  structure: '構造',
  eeat: 'E-E-A-T',
  seoOverall: 'SEO総合',
}

/**
 * スコアからパーセンタイルを計算
 */
function calculatePercentile(score: number, benchmark: BenchmarkData): number {
  if (score <= benchmark.p10) {
    return Math.round((score / benchmark.p10) * 10)
  } else if (score <= benchmark.p25) {
    return Math.round(10 + ((score - benchmark.p10) / (benchmark.p25 - benchmark.p10)) * 15)
  } else if (score <= benchmark.p50) {
    return Math.round(25 + ((score - benchmark.p25) / (benchmark.p50 - benchmark.p25)) * 25)
  } else if (score <= benchmark.p75) {
    return Math.round(50 + ((score - benchmark.p50) / (benchmark.p75 - benchmark.p50)) * 25)
  } else if (score <= benchmark.p90) {
    return Math.round(75 + ((score - benchmark.p75) / (benchmark.p90 - benchmark.p75)) * 15)
  } else {
    return Math.min(99, Math.round(90 + ((score - benchmark.p90) / (100 - benchmark.p90)) * 10))
  }
}

/**
 * パーセンタイルから解釈を生成
 */
function interpretPercentile(percentile: number): BenchmarkInterpretation {
  if (percentile >= 90) return 'top-10'
  if (percentile >= 75) return 'top-25'
  if (percentile >= 55) return 'above-avg'
  if (percentile >= 45) return 'average'
  if (percentile >= 25) return 'below-avg'
  if (percentile >= 10) return 'bottom-25'
  return 'bottom-10'
}

/**
 * 解釈の日本語テキスト
 */
function getInterpretationText(interpretation: BenchmarkInterpretation): string {
  const texts: Record<BenchmarkInterpretation, string> = {
    'top-10': '上位10%（優秀）',
    'top-25': '上位25%（良好）',
    'above-avg': '平均以上',
    'average': '平均付近',
    'below-avg': '平均以下',
    'bottom-25': '下位25%（要改善）',
    'bottom-10': '下位10%（緊急改善）',
  }
  return texts[interpretation]
}

/**
 * ベンチマークサービスクラス
 */
export class BenchmarkService {
  private benchmarks: Map<string, BenchmarkData>
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient
    this.benchmarks = new Map()

    // デフォルトベンチマークをロード
    for (const benchmark of DEFAULT_BENCHMARKS) {
      const key = this.getBenchmarkKey(benchmark.industry, benchmark.contentType, benchmark.metric)
      this.benchmarks.set(key, benchmark)
    }
  }

  private getBenchmarkKey(industry: string, contentType: ContentType, metric: string): string {
    return `${industry}:${contentType}:${metric}`
  }

  /**
   * データベースからベンチマークをロード
   */
  async loadBenchmarksFromDB(): Promise<void> {
    if (!this.supabaseClient) return

    try {
      const { data, error } = await this.supabaseClient
        .from('industry_benchmarks')
        .select('*')

      if (error) throw error

      for (const row of data || []) {
        const key = this.getBenchmarkKey(row.industry, row.content_type, row.metric)
        this.benchmarks.set(key, {
          industry: row.industry,
          contentType: row.content_type,
          metric: row.metric,
          p10: row.p10,
          p25: row.p25,
          p50: row.p50,
          p75: row.p75,
          p90: row.p90,
          sampleSize: row.sample_size || 0,
          lastUpdated: row.updated_at || new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('ベンチマークのロードに失敗:', error)
    }
  }

  /**
   * 特定のベンチマークを取得
   */
  getBenchmark(industry: string, contentType: ContentType, metric: string): BenchmarkData | null {
    // まず完全一致を試す
    let key = this.getBenchmarkKey(industry, contentType, metric)
    let benchmark = this.benchmarks.get(key)
    if (benchmark) return benchmark

    // 業界を'general'でフォールバック
    key = this.getBenchmarkKey('general', contentType, metric)
    benchmark = this.benchmarks.get(key)
    if (benchmark) return benchmark

    // コンテンツタイプを'landing-page'でフォールバック
    key = this.getBenchmarkKey('general', 'landing-page', metric)
    return this.benchmarks.get(key) || null
  }

  /**
   * スコアをベンチマークと比較
   */
  compareScore(
    score: number,
    metric: string,
    industry: string = 'general',
    contentType: ContentType = 'landing-page'
  ): BenchmarkComparison | null {
    const benchmark = this.getBenchmark(industry, contentType, metric)
    if (!benchmark) return null

    const percentile = calculatePercentile(score, benchmark)
    const interpretation = interpretPercentile(percentile)
    const industryAvg = benchmark.p50
    const gap = score - industryAvg
    const improvementPotential = Math.max(0, benchmark.p75 - score)

    return {
      metric,
      score,
      percentile,
      interpretation,
      industryAvg,
      gap,
      improvementPotential,
    }
  }

  /**
   * 全メトリクスのベンチマークレポートを生成
   */
  generateReport(
    scores: Record<string, number>,
    industry: string = 'general',
    contentType: ContentType = 'landing-page'
  ): BenchmarkReport {
    const comparisons: BenchmarkComparison[] = []
    const strengths: string[] = []
    const weaknesses: string[] = []
    const quickWinMetrics: string[] = []

    // 各メトリクスを比較
    const metrics = ['overall', 'aiCitation', 'questionFit', 'coverage', 'structure', 'eeat', 'seoOverall']

    for (const metric of metrics) {
      const score = scores[metric]
      if (score === undefined) continue

      const comparison = this.compareScore(score, metric, industry, contentType)
      if (comparison) {
        comparisons.push(comparison)

        const label = METRIC_LABELS[metric] || metric

        // 強みと弱みを分類
        if (comparison.percentile >= 70) {
          strengths.push(`${label}: 上位${100 - comparison.percentile}%（${comparison.score}点）`)
        } else if (comparison.percentile <= 30) {
          weaknesses.push(`${label}: ${getInterpretationText(comparison.interpretation)}（${comparison.score}点、業界平均${comparison.industryAvg}点）`)
        }

        // Quick Win候補（改善余地が大きく、平均以下のもの）
        if (comparison.improvementPotential >= 15 && comparison.percentile < 50) {
          quickWinMetrics.push(metric)
        }
      }
    }

    // 総合パーセンタイルの計算
    const overallComparison = comparisons.find(c => c.metric === 'overall')
    const overallPercentile = overallComparison?.percentile || 50
    const overallInterpretation = overallComparison?.interpretation || 'average'

    // サマリーテキスト生成
    const summaryText = this.generateSummaryText(
      overallPercentile,
      overallInterpretation,
      strengths,
      weaknesses,
      contentType
    )

    return {
      industry,
      contentType,
      overallPercentile,
      overallInterpretation,
      comparisons,
      strengths,
      weaknesses,
      quickWinMetrics,
      summaryText,
    }
  }

  /**
   * サマリーテキストを生成
   */
  private generateSummaryText(
    percentile: number,
    interpretation: BenchmarkInterpretation,
    strengths: string[],
    weaknesses: string[],
    contentType: ContentType
  ): string {
    const contentTypeLabel: Record<ContentType, string> = {
      'news-article': 'ニュース記事',
      'blog-post': 'ブログ記事',
      'product-page': '製品ページ',
      'landing-page': 'ランディングページ',
      'documentation': 'ドキュメント',
    }

    let summary = ''

    // ヘッドライン
    if (percentile >= 75) {
      summary = `この${contentTypeLabel[contentType]}は業界上位${100 - percentile}%のパフォーマンスを示しています。`
    } else if (percentile >= 50) {
      summary = `この${contentTypeLabel[contentType]}は業界平均以上のパフォーマンスですが、まだ改善の余地があります。`
    } else if (percentile >= 25) {
      summary = `この${contentTypeLabel[contentType]}は業界平均以下のパフォーマンスです。優先的な改善が推奨されます。`
    } else {
      summary = `この${contentTypeLabel[contentType]}は業界下位25%に位置しており、緊急の改善が必要です。`
    }

    // 強みの追加
    if (strengths.length > 0) {
      summary += `\n\n**強み**: ${strengths.slice(0, 2).join('、')}`
    }

    // 弱みの追加
    if (weaknesses.length > 0) {
      summary += `\n\n**要改善**: ${weaknesses.slice(0, 2).join('、')}`
    }

    return summary
  }

  /**
   * 分布グラフ用データを生成
   */
  getDistributionData(
    metric: string,
    industry: string = 'general',
    contentType: ContentType = 'landing-page'
  ): { labels: string[]; values: number[] } | null {
    const benchmark = this.getBenchmark(industry, contentType, metric)
    if (!benchmark) return null

    return {
      labels: ['P10', 'P25', 'P50 (中央値)', 'P75', 'P90'],
      values: [benchmark.p10, benchmark.p25, benchmark.p50, benchmark.p75, benchmark.p90],
    }
  }
}

/**
 * デフォルトのベンチマークサービスインスタンスを作成
 */
export function createBenchmarkService(supabaseClient?: any): BenchmarkService {
  return new BenchmarkService(supabaseClient)
}

export { METRIC_LABELS }
