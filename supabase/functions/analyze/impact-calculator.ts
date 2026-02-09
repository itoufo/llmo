/**
 * インパクト計算モジュール
 * 改善施策ごとの工数推定、スコア上昇予測、ROI計算
 */

export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high' | 'major'

export interface EffortEstimate {
  level: EffortLevel
  hours: { min: number; max: number }
  description: string
}

export interface ImpactPrediction {
  metricAffected: string
  currentScore: number
  predictedScore: number
  confidenceLevel: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface ROICalculation {
  effort: EffortEstimate
  impact: ImpactPrediction[]
  totalScoreGain: number
  roiScore: number // スコア改善点数 / 工数（時間）
  priorityRank: number
  isQuickWin: boolean
}

export interface ImprovementWithImpact {
  id: string
  title: string
  description: string
  category: string
  effort: EffortEstimate
  impact: ImpactPrediction[]
  roi: ROICalculation
  implementationOrder: number
  evidence?: {
    contentQuotes: string[]
    scoreJustification: string
  }
  tags: string[]
}

// 工数レベルの定義
const EFFORT_DEFINITIONS: Record<EffortLevel, EffortEstimate> = {
  minimal: {
    level: 'minimal',
    hours: { min: 0.5, max: 2 },
    description: '30分〜2時間で完了可能な軽微な修正',
  },
  low: {
    level: 'low',
    hours: { min: 2, max: 4 },
    description: '2〜4時間で完了可能な小規模修正',
  },
  medium: {
    level: 'medium',
    hours: { min: 4, max: 8 },
    description: '半日〜1日で完了可能な中規模修正',
  },
  high: {
    level: 'high',
    hours: { min: 8, max: 24 },
    description: '1〜3日で完了可能な大規模修正',
  },
  major: {
    level: 'major',
    hours: { min: 24, max: 80 },
    description: '1週間以上かかる大規模プロジェクト',
  },
}

// 改善カテゴリごとの典型的な工数
const CATEGORY_EFFORT_MAP: Record<string, EffortLevel> = {
  // SEO関連
  'meta-title': 'minimal',
  'meta-description': 'minimal',
  'heading-structure': 'low',
  'alt-text': 'low',
  'internal-links': 'medium',
  'schema-markup': 'medium',
  'page-speed': 'high',
  'mobile-optimization': 'high',

  // LLMO関連
  'question-answer-format': 'low',
  'summary-section': 'low',
  'definition-clarity': 'minimal',
  'fact-verification': 'medium',
  'source-citation': 'medium',
  'content-completeness': 'high',

  // E-E-A-T関連
  'author-info': 'minimal',
  'expertise-signals': 'medium',
  'trust-indicators': 'medium',
  'social-proof': 'medium',
  'content-freshness': 'low',
}

// メトリクス改善の予測スコアゲイン
const METRIC_IMPROVEMENT_MAP: Record<string, { metric: string; baseGain: number; confidenceMultiplier: number }> = {
  'meta-title': { metric: 'seoOverall', baseGain: 5, confidenceMultiplier: 0.9 },
  'meta-description': { metric: 'seoOverall', baseGain: 4, confidenceMultiplier: 0.9 },
  'heading-structure': { metric: 'structure', baseGain: 8, confidenceMultiplier: 0.8 },
  'alt-text': { metric: 'seoOverall', baseGain: 3, confidenceMultiplier: 0.95 },
  'internal-links': { metric: 'seoOverall', baseGain: 6, confidenceMultiplier: 0.7 },
  'schema-markup': { metric: 'aiCitation', baseGain: 10, confidenceMultiplier: 0.75 },
  'page-speed': { metric: 'seoOverall', baseGain: 8, confidenceMultiplier: 0.6 },
  'mobile-optimization': { metric: 'seoOverall', baseGain: 7, confidenceMultiplier: 0.6 },
  'question-answer-format': { metric: 'questionFit', baseGain: 12, confidenceMultiplier: 0.85 },
  'summary-section': { metric: 'aiCitation', baseGain: 8, confidenceMultiplier: 0.8 },
  'definition-clarity': { metric: 'aiCitation', baseGain: 6, confidenceMultiplier: 0.85 },
  'fact-verification': { metric: 'eeat', baseGain: 10, confidenceMultiplier: 0.7 },
  'source-citation': { metric: 'eeat', baseGain: 8, confidenceMultiplier: 0.8 },
  'content-completeness': { metric: 'coverage', baseGain: 15, confidenceMultiplier: 0.65 },
  'author-info': { metric: 'eeat', baseGain: 7, confidenceMultiplier: 0.9 },
  'expertise-signals': { metric: 'eeat', baseGain: 10, confidenceMultiplier: 0.7 },
  'trust-indicators': { metric: 'eeat', baseGain: 8, confidenceMultiplier: 0.75 },
  'social-proof': { metric: 'eeat', baseGain: 5, confidenceMultiplier: 0.8 },
  'content-freshness': { metric: 'eeat', baseGain: 4, confidenceMultiplier: 0.85 },
}

/**
 * 工数を推定
 */
export function estimateEffort(category: string, customHours?: number): EffortEstimate {
  // カスタム工数が指定されている場合
  if (customHours !== undefined) {
    if (customHours <= 2) return EFFORT_DEFINITIONS.minimal
    if (customHours <= 4) return EFFORT_DEFINITIONS.low
    if (customHours <= 8) return EFFORT_DEFINITIONS.medium
    if (customHours <= 24) return EFFORT_DEFINITIONS.high
    return EFFORT_DEFINITIONS.major
  }

  // カテゴリベースの推定
  const level = CATEGORY_EFFORT_MAP[category] || 'medium'
  return EFFORT_DEFINITIONS[level]
}

/**
 * インパクトを予測
 */
export function predictImpact(
  category: string,
  currentScores: Record<string, number>,
  contextFactors?: {
    contentQuality?: number // 0-1: 既存コンテンツの質
    technicalDebt?: number  // 0-1: 技術的負債の程度
    competitiveGap?: number // 0-1: 競合との差
  }
): ImpactPrediction[] {
  const impacts: ImpactPrediction[] = []
  const improvementInfo = METRIC_IMPROVEMENT_MAP[category]

  if (!improvementInfo) {
    // 汎用的な改善予測
    return [{
      metricAffected: 'overall',
      currentScore: currentScores.overall || 50,
      predictedScore: Math.min(100, (currentScores.overall || 50) + 5),
      confidenceLevel: 'low',
      reasoning: '一般的な改善効果を予測',
    }]
  }

  const currentScore = currentScores[improvementInfo.metric] || 50
  let baseGain = improvementInfo.baseGain

  // コンテキストファクターによる調整
  if (contextFactors) {
    // 既存コンテンツの質が高いと、改善余地は小さい
    if (contextFactors.contentQuality !== undefined) {
      baseGain *= (1 - contextFactors.contentQuality * 0.3)
    }
    // 技術的負債が高いと、改善効果は大きい
    if (contextFactors.technicalDebt !== undefined) {
      baseGain *= (1 + contextFactors.technicalDebt * 0.2)
    }
    // 競合との差が大きいと、改善効果は大きい
    if (contextFactors.competitiveGap !== undefined) {
      baseGain *= (1 + contextFactors.competitiveGap * 0.3)
    }
  }

  // スコアが既に高い場合は改善幅を縮小
  const diminishingFactor = 1 - (currentScore / 100) * 0.5
  const adjustedGain = Math.round(baseGain * diminishingFactor)

  const predictedScore = Math.min(100, currentScore + adjustedGain)

  // 信頼度の決定
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium'
  const confidenceMultiplier = improvementInfo.confidenceMultiplier
  if (confidenceMultiplier >= 0.85) {
    confidenceLevel = 'high'
  } else if (confidenceMultiplier < 0.7) {
    confidenceLevel = 'low'
  }

  impacts.push({
    metricAffected: improvementInfo.metric,
    currentScore,
    predictedScore,
    confidenceLevel,
    reasoning: generateReasoning(category, currentScore, predictedScore),
  })

  // 関連メトリクスへの間接的影響
  const relatedMetrics = getRelatedMetrics(improvementInfo.metric)
  for (const relatedMetric of relatedMetrics) {
    const relatedCurrentScore = currentScores[relatedMetric] || 50
    const relatedGain = Math.round(adjustedGain * 0.3) // 間接効果は30%
    impacts.push({
      metricAffected: relatedMetric,
      currentScore: relatedCurrentScore,
      predictedScore: Math.min(100, relatedCurrentScore + relatedGain),
      confidenceLevel: 'low',
      reasoning: `${improvementInfo.metric}の改善による間接効果`,
    })
  }

  return impacts
}

/**
 * 関連メトリクスを取得
 */
function getRelatedMetrics(metric: string): string[] {
  const relations: Record<string, string[]> = {
    seoOverall: ['overall'],
    structure: ['overall', 'aiCitation'],
    aiCitation: ['overall', 'questionFit'],
    questionFit: ['overall', 'aiCitation'],
    coverage: ['overall', 'questionFit'],
    eeat: ['overall', 'aiCitation'],
  }
  return relations[metric] || ['overall']
}

/**
 * 改善理由を生成
 */
function generateReasoning(category: string, currentScore: number, predictedScore: number): string {
  const gain = predictedScore - currentScore

  const reasonings: Record<string, string> = {
    'meta-title': `タイトルの最適化により、検索エンジンとAIの両方での認識が向上します。`,
    'meta-description': `メタディスクリプションの改善により、クリック率とAI引用の可能性が向上します。`,
    'heading-structure': `見出し構造の最適化により、コンテンツの理解性が${gain}点向上する見込みです。`,
    'alt-text': `画像の代替テキストを追加することで、アクセシビリティとSEOが向上します。`,
    'schema-markup': `構造化データの追加により、AI検索での引用可能性が大幅に向上します。`,
    'question-answer-format': `Q&A形式の導入により、質問に対する適合性が${gain}点向上する見込みです。`,
    'summary-section': `要約セクションの追加により、AI引用の可能性が向上します。`,
    'author-info': `著者情報の追加により、E-E-A-Tスコアが向上します。`,
    'source-citation': `出典の明記により、信頼性とE-E-A-Tスコアが向上します。`,
    'content-completeness': `コンテンツの充実により、カバレッジスコアが${gain}点向上する見込みです。`,
  }

  return reasonings[category] || `この改善により、スコアが${gain}点向上する見込みです。`
}

/**
 * ROIを計算
 */
export function calculateROI(
  effort: EffortEstimate,
  impacts: ImpactPrediction[]
): ROICalculation {
  // 総スコアゲインの計算
  const totalScoreGain = impacts.reduce((sum, impact) => {
    const gain = impact.predictedScore - impact.currentScore
    // 信頼度による重み付け
    const confidenceWeight = {
      high: 1.0,
      medium: 0.75,
      low: 0.5,
    }[impact.confidenceLevel]
    return sum + gain * confidenceWeight
  }, 0)

  // 平均工数
  const avgHours = (effort.hours.min + effort.hours.max) / 2

  // ROIスコア（1時間あたりのスコア改善点数）
  const roiScore = avgHours > 0 ? totalScoreGain / avgHours : 0

  // Quick Win判定（工数が小さく、効果が大きい）
  const isQuickWin =
    (effort.level === 'minimal' || effort.level === 'low') &&
    totalScoreGain >= 5

  // 優先順位（ROIスコアに基づく）
  let priorityRank: number
  if (roiScore >= 3) priorityRank = 1  // 最優先
  else if (roiScore >= 2) priorityRank = 2
  else if (roiScore >= 1) priorityRank = 3
  else if (roiScore >= 0.5) priorityRank = 4
  else priorityRank = 5

  return {
    effort,
    impact: impacts,
    totalScoreGain: Math.round(totalScoreGain * 10) / 10,
    roiScore: Math.round(roiScore * 100) / 100,
    priorityRank,
    isQuickWin,
  }
}

/**
 * 改善案にインパクト情報を付加
 */
export function enrichImprovementWithImpact(
  improvement: {
    title: string
    description: string
    category: string
    evidence?: {
      contentQuotes: string[]
      scoreJustification: string
    }
  },
  currentScores: Record<string, number>,
  index: number
): ImprovementWithImpact {
  const effort = estimateEffort(improvement.category)
  const impacts = predictImpact(improvement.category, currentScores)
  const roi = calculateROI(effort, impacts)

  // タグ生成
  const tags: string[] = []
  if (roi.isQuickWin) tags.push('Quick Win')
  if (effort.level === 'minimal') tags.push('即日実施可')
  if (roi.totalScoreGain >= 10) tags.push('高効果')
  if (impacts.some(i => i.metricAffected === 'aiCitation')) tags.push('AI引用')
  if (impacts.some(i => i.metricAffected === 'eeat')) tags.push('E-E-A-T')

  return {
    id: `improvement-${index + 1}`,
    title: improvement.title,
    description: improvement.description,
    category: improvement.category,
    effort,
    impact: impacts,
    roi,
    implementationOrder: roi.priorityRank,
    evidence: improvement.evidence,
    tags,
  }
}

/**
 * 改善案をROI順にソート
 */
export function sortImprovementsByROI(improvements: ImprovementWithImpact[]): ImprovementWithImpact[] {
  return [...improvements].sort((a, b) => {
    // まずQuick Winを優先
    if (a.roi.isQuickWin && !b.roi.isQuickWin) return -1
    if (!a.roi.isQuickWin && b.roi.isQuickWin) return 1
    // 次にROIスコアで並べる
    return b.roi.roiScore - a.roi.roiScore
  })
}

/**
 * Quick Win改善案を抽出
 */
export function extractQuickWins(improvements: ImprovementWithImpact[]): ImprovementWithImpact[] {
  return improvements.filter(i => i.roi.isQuickWin)
}

/**
 * フェーズ別にグループ化
 */
export function groupByPhase(improvements: ImprovementWithImpact[]): {
  phase1: ImprovementWithImpact[] // 即座に実施（minimal/low）
  phase2: ImprovementWithImpact[] // 短期（medium）
  phase3: ImprovementWithImpact[] // 中長期（high/major）
} {
  return {
    phase1: improvements.filter(i => i.effort.level === 'minimal' || i.effort.level === 'low'),
    phase2: improvements.filter(i => i.effort.level === 'medium'),
    phase3: improvements.filter(i => i.effort.level === 'high' || i.effort.level === 'major'),
  }
}

/**
 * 総合インパクトサマリーを計算
 */
export function calculateTotalImpactSummary(improvements: ImprovementWithImpact[]): {
  totalScoreGain: number
  totalHoursMin: number
  totalHoursMax: number
  avgROI: number
  quickWinCount: number
  quickWinScoreGain: number
  phaseBreakdown: {
    phase: string
    items: number
    scoreGain: number
    hours: { min: number; max: number }
  }[]
} {
  const phases = groupByPhase(improvements)
  const quickWins = extractQuickWins(improvements)

  const totalScoreGain = improvements.reduce((sum, i) => sum + i.roi.totalScoreGain, 0)
  const totalHoursMin = improvements.reduce((sum, i) => sum + i.effort.hours.min, 0)
  const totalHoursMax = improvements.reduce((sum, i) => sum + i.effort.hours.max, 0)
  const avgROI = improvements.length > 0
    ? improvements.reduce((sum, i) => sum + i.roi.roiScore, 0) / improvements.length
    : 0

  const calculatePhaseStats = (items: ImprovementWithImpact[]) => ({
    items: items.length,
    scoreGain: items.reduce((sum, i) => sum + i.roi.totalScoreGain, 0),
    hours: {
      min: items.reduce((sum, i) => sum + i.effort.hours.min, 0),
      max: items.reduce((sum, i) => sum + i.effort.hours.max, 0),
    },
  })

  return {
    totalScoreGain: Math.round(totalScoreGain * 10) / 10,
    totalHoursMin: Math.round(totalHoursMin * 10) / 10,
    totalHoursMax: Math.round(totalHoursMax * 10) / 10,
    avgROI: Math.round(avgROI * 100) / 100,
    quickWinCount: quickWins.length,
    quickWinScoreGain: Math.round(quickWins.reduce((sum, i) => sum + i.roi.totalScoreGain, 0) * 10) / 10,
    phaseBreakdown: [
      { phase: 'Phase 1: 即座に実施', ...calculatePhaseStats(phases.phase1) },
      { phase: 'Phase 2: 短期', ...calculatePhaseStats(phases.phase2) },
      { phase: 'Phase 3: 中長期', ...calculatePhaseStats(phases.phase3) },
    ],
  }
}
