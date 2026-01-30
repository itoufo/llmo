/**
 * Consulting Data Transformer
 * Transforms AnalyzeResult into consulting-grade display formats
 */

import type {
  AnalyzeResult,
  EnhancedAnalyzeResult,
  ExecutiveSummaryData,
  QuickWinItem,
  BenchmarkData,
  RoadmapPhase,
  RoadmapItem,
  KeyFinding,
  Improvement,
} from '../types'

// Default industry benchmarks (P50 = median)
const DEFAULT_BENCHMARKS: Record<string, { p10: number; p25: number; p50: number; p75: number; p90: number }> = {
  aiCitation: { p10: 25, p25: 40, p50: 55, p75: 70, p90: 85 },
  questionFit: { p10: 20, p25: 35, p50: 50, p75: 65, p90: 80 },
  coverage: { p10: 30, p25: 45, p50: 60, p75: 75, p90: 88 },
  structure: { p10: 35, p25: 50, p50: 65, p75: 78, p90: 90 },
  eeat: { p10: 20, p25: 35, p50: 50, p75: 68, p90: 82 },
  overall: { p10: 28, p25: 42, p50: 56, p75: 70, p90: 84 },
}

const METRIC_LABELS: Record<string, string> = {
  aiCitation: 'AI引用性',
  questionFit: '質問適合',
  coverage: '概念カバレッジ',
  structure: '構造',
  eeat: 'E-E-A-T',
  overall: '総合',
}

/**
 * Calculate percentile from score
 */
function calculatePercentile(score: number, benchmarks: { p10: number; p25: number; p50: number; p75: number; p90: number }): number {
  if (score >= benchmarks.p90) return 90 + (score - benchmarks.p90) / (100 - benchmarks.p90) * 10
  if (score >= benchmarks.p75) return 75 + (score - benchmarks.p75) / (benchmarks.p90 - benchmarks.p75) * 15
  if (score >= benchmarks.p50) return 50 + (score - benchmarks.p50) / (benchmarks.p75 - benchmarks.p50) * 25
  if (score >= benchmarks.p25) return 25 + (score - benchmarks.p25) / (benchmarks.p50 - benchmarks.p25) * 25
  if (score >= benchmarks.p10) return 10 + (score - benchmarks.p10) / (benchmarks.p25 - benchmarks.p10) * 15
  return score / benchmarks.p10 * 10
}

/**
 * Get interpretation from percentile
 */
function getInterpretation(percentile: number): string {
  if (percentile >= 90) return 'top-10'
  if (percentile >= 75) return 'top-25'
  if (percentile >= 55) return 'above-avg'
  if (percentile >= 45) return 'average'
  if (percentile >= 25) return 'below-avg'
  if (percentile >= 10) return 'bottom-25'
  return 'bottom-10'
}

/**
 * Determine overall verdict from score
 */
function determineVerdict(score: number): 'excellent' | 'good' | 'needs-improvement' | 'critical' {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'needs-improvement'
  return 'critical'
}

/**
 * Generate headline from result
 */
function generateHeadline(result: AnalyzeResult): string {
  const verdict = determineVerdict(result.scores.overall)
  const llmo = result.scores.llmoOverall || 0
  const seo = result.scores.seoOverall || 0

  if (verdict === 'excellent') {
    return `優秀なコンテンツです。LLMOスコア${llmo}点、SEOスコア${seo}点で業界トップクラスの品質を維持しています。`
  }
  if (verdict === 'good') {
    return `良好なコンテンツですが、さらなる改善余地があります。特に${llmo < seo ? 'LLMO' : 'SEO'}面での強化が効果的です。`
  }
  if (verdict === 'needs-improvement') {
    const weakArea = llmo < seo ? 'AI引用性' : 'SEO最適化'
    return `改善が必要です。${weakArea}のスコアが低く、競合に対して不利な状況です。Quick Winから着手することをお勧めします。`
  }
  return `緊急対応が必要です。コンテンツの基本的な品質改善から始め、段階的に最適化を進めてください。`
}

/**
 * Extract key findings from result
 */
function extractKeyFindings(result: AnalyzeResult): KeyFinding[] {
  const findings: KeyFinding[] = []

  // Score-based findings
  if (result.scores.eeat < 40) {
    findings.push({ icon: 'critical', finding: 'E-E-A-Tスコアが低く、信頼性の向上が急務です（著者情報、出典、専門性の明示）' })
  }
  if (result.scores.structure < 50) {
    findings.push({ icon: 'warning', finding: '構造スコアが低く、見出し階層やリスト形式の改善でLLMの解析効率が向上します' })
  }
  if (result.scores.questionFit < 50) {
    findings.push({ icon: 'warning', finding: 'ユーザーの質問に十分回答できていません。FAQ形式のコンテンツ追加を検討してください' })
  }
  if (result.scores.coverage < 50) {
    findings.push({ icon: 'info', finding: 'トピックのカバレッジが不足しています。関連概念や用語の説明を追加すると効果的です' })
  }

  // Positive findings
  if (result.scores.aiCitation >= 70) {
    findings.push({ icon: 'success', finding: 'AI引用性が高く、LLMからの参照されやすいコンテンツです' })
  }
  if (result.scores.structure >= 70) {
    findings.push({ icon: 'success', finding: '構造が整理されており、LLMが情報を抽出しやすい形式です' })
  }

  // High priority improvements
  const highPriority = result.improvements.filter(i => i.priority === 'high')
  if (highPriority.length >= 5) {
    findings.push({ icon: 'warning', finding: `高優先度の改善項目が${highPriority.length}件あります。早急な対応を推奨します` })
  }

  return findings.slice(0, 5) // Max 5 findings
}

/**
 * Transform result to Executive Summary data
 */
export function toExecutiveSummary(result: AnalyzeResult): ExecutiveSummaryData {
  const overallPercentile = calculatePercentile(result.scores.overall, DEFAULT_BENCHMARKS.overall)

  // Calculate improvement potential (distance to p75)
  const p75Target = DEFAULT_BENCHMARKS.overall.p75
  const improvementPotential = Math.max(0, p75Target - result.scores.overall)

  // Count quick wins (high priority + would be low effort based on category)
  const quickWinCategories = ['structure', 'seo-title', 'seo-meta', 'seo-heading']
  const quickWinCount = result.improvements.filter(
    i => i.priority === 'high' && quickWinCategories.includes(i.category)
  ).length

  // Estimate total hours
  const totalImprovements = result.improvements.length
  const minHours = Math.ceil(totalImprovements * 0.5)
  const maxHours = Math.ceil(totalImprovements * 2)

  return {
    headline: generateHeadline(result),
    keyFindings: extractKeyFindings(result),
    overallVerdict: determineVerdict(result.scores.overall),
    scores: {
      overall: result.scores.overall,
      llmoOverall: result.scores.llmoOverall || Math.round(
        (result.scores.aiCitation + result.scores.questionFit + result.scores.coverage +
         result.scores.structure + result.scores.eeat) / 5
      ),
      seoOverall: result.scores.seoOverall || 0,
    },
    benchmarkPercentile: Math.round(overallPercentile),
    improvementPotential,
    quickWinCount,
    totalEstimatedHours: { min: minHours, max: maxHours },
  }
}

/**
 * Transform improvements to Quick Win items
 */
export function toQuickWins(result: AnalyzeResult): { items: QuickWinItem[]; totalTimeEstimate: string; expectedTotalGain: string } {
  // Filter for quick wins: high priority OR structure/meta related
  const quickWinCandidates = result.improvements.filter(imp => {
    const isHighPriority = imp.priority === 'high'
    const isQuickCategory = ['structure', 'seo-title', 'seo-meta', 'seo-heading', 'seo-image'].includes(imp.category)
    return isHighPriority || isQuickCategory
  })

  // Convert to QuickWinItem format
  const items: QuickWinItem[] = quickWinCandidates.slice(0, 8).map((imp, idx) => {
    // Estimate effort based on category
    const effortMap: Record<string, string> = {
      'seo-title': '15分',
      'seo-meta': '15分',
      'seo-heading': '30分',
      'structure': '30分',
      'seo-image': '1時間',
      'content': '2時間',
      'eeat': '1時間',
      'question': '1時間',
      'concept': '2時間',
    }

    // Estimate impact based on priority
    const impactMap: Record<string, string> = {
      high: '+5-8点',
      medium: '+3-5点',
      low: '+1-3点',
    }

    // Map category to metric
    const metricMap: Record<string, string> = {
      'seo-title': 'SEOタイトル',
      'seo-meta': 'SEOメタ',
      'seo-heading': '構造',
      'structure': '構造',
      'seo-image': 'SEO画像',
      'content': 'カバレッジ',
      'eeat': 'E-E-A-T',
      'question': '質問適合',
      'concept': 'カバレッジ',
    }

    return {
      id: `qw-${idx}`,
      title: imp.issue,
      description: imp.action,
      effort: effortMap[imp.category] || '1時間',
      impact: impactMap[imp.priority],
      category: imp.category,
      example: imp.example,
      metricAffected: metricMap[imp.category] || '総合',
      steps: imp.action.includes('。')
        ? imp.action.split('。').filter(s => s.trim()).map(s => s.trim())
        : undefined,
    }
  })

  // Calculate totals
  const totalMinutes = items.reduce((sum, item) => {
    const match = item.effort.match(/(\d+)/)
    const minutes = match ? parseInt(match[1]) : 60
    return sum + (item.effort.includes('時間') ? minutes * 60 : minutes)
  }, 0)

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const totalTimeEstimate = mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`

  const highCount = items.filter(i => i.impact.includes('5-8')).length
  const medCount = items.filter(i => i.impact.includes('3-5')).length
  const lowCount = items.length - highCount - medCount
  const minGain = highCount * 5 + medCount * 3 + lowCount * 1
  const maxGain = highCount * 8 + medCount * 5 + lowCount * 3

  return {
    items,
    totalTimeEstimate,
    expectedTotalGain: `+${minGain}-${maxGain}点`,
  }
}

/**
 * Transform result to Benchmark comparison data
 */
export function toBenchmarkData(result: AnalyzeResult): BenchmarkData[] {
  const metrics = ['aiCitation', 'questionFit', 'coverage', 'structure', 'eeat'] as const

  return metrics.map(metric => {
    const score = result.scores[metric]
    const benchmark = DEFAULT_BENCHMARKS[metric]
    const percentile = calculatePercentile(score, benchmark)
    const p50 = benchmark.p50
    const p75 = benchmark.p75

    return {
      metric,
      label: METRIC_LABELS[metric],
      score,
      percentile: Math.round(percentile),
      interpretation: getInterpretation(percentile),
      industryAvg: p50,
      gap: score - p50,
      improvementPotential: Math.max(0, p75 - score),
    }
  })
}

/**
 * Calculate overall percentile
 */
export function calculateOverallPercentile(result: AnalyzeResult): number {
  return Math.round(calculatePercentile(result.scores.overall, DEFAULT_BENCHMARKS.overall))
}

/**
 * Get overall interpretation
 */
export function getOverallInterpretation(result: AnalyzeResult): string {
  const percentile = calculatePercentile(result.scores.overall, DEFAULT_BENCHMARKS.overall)
  return getInterpretation(percentile)
}

/**
 * Transform improvements to Roadmap phases
 */
export function toRoadmap(result: AnalyzeResult): RoadmapPhase[] {
  // Group by phase
  const phase1Items: Improvement[] = [] // Immediate (title, meta, structure)
  const phase2Items: Improvement[] = [] // Short-term (content, questions)
  const phase3Items: Improvement[] = [] // Medium-term (EEAT, advanced)

  for (const imp of result.improvements) {
    if (['seo-title', 'seo-meta', 'seo-heading', 'structure'].includes(imp.category)) {
      phase1Items.push(imp)
    } else if (['question', 'content', 'concept', 'seo-image'].includes(imp.category)) {
      phase2Items.push(imp)
    } else {
      phase3Items.push(imp)
    }
  }

  const createRoadmapItems = (items: Improvement[]): RoadmapItem[] => {
    return items.slice(0, 5).map((imp, idx) => ({
      id: `ri-${idx}-${imp.category}`,
      title: imp.issue,
      description: imp.action,
      effort: imp.priority === 'high' ? '30分-1時間' : '1-2時間',
      impact: imp.priority === 'high' ? '+5-8点' : '+3-5点',
    }))
  }

  const phases: RoadmapPhase[] = []

  if (phase1Items.length > 0) {
    phases.push({
      id: 'phase-1',
      phase: 'Phase 1: 即座に実施',
      timeframe: '1-2日',
      description: 'タイトル、メタ情報、構造の基本最適化',
      items: createRoadmapItems(phase1Items),
      expectedGain: `+${Math.min(phase1Items.length * 3, 15)}点`,
    })
  }

  if (phase2Items.length > 0) {
    phases.push({
      id: 'phase-2',
      phase: 'Phase 2: 短期改善',
      timeframe: '1週間',
      description: 'コンテンツ拡充、質問対応、画像最適化',
      items: createRoadmapItems(phase2Items),
      expectedGain: `+${Math.min(phase2Items.length * 4, 20)}点`,
    })
  }

  if (phase3Items.length > 0) {
    phases.push({
      id: 'phase-3',
      phase: 'Phase 3: 中期強化',
      timeframe: '2-4週間',
      description: 'E-E-A-T強化、高度な最適化',
      items: createRoadmapItems(phase3Items),
      expectedGain: `+${Math.min(phase3Items.length * 5, 25)}点`,
    })
  }

  return phases
}

/**
 * Check if result has consulting insights from LLM
 */
export function hasConsultingInsights(result: AnalyzeResult): result is EnhancedAnalyzeResult {
  return 'consultingInsights' in result && result.consultingInsights !== undefined
}
