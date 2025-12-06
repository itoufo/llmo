import type { LLMEvaluationResult } from '../types'

// 各スコアの重み（合計1.0）
const WEIGHTS = {
  aiCitation: 0.30,
  questionFit: 0.20,
  coverage: 0.20,
  structure: 0.15,
  eeat: 0.15
}

/**
 * 各スコアを加重平均して総合スコアを計算
 */
export function calculateOverallScore(result: LLMEvaluationResult): number {
  const weightedScore =
    result.aiCitation.score * WEIGHTS.aiCitation +
    result.questionFit.score * WEIGHTS.questionFit +
    result.coverage.score * WEIGHTS.coverage +
    result.structure.score * WEIGHTS.structure +
    result.eeat.score * WEIGHTS.eeat

  return Math.round(weightedScore)
}

/**
 * LLM評価結果から改善点を抽出
 * 優先度の高いものから最大5つまで返す
 */
export function extractImprovements(result: LLMEvaluationResult): string[] {
  const improvements: string[] = []

  // 構造の問題点（最優先）
  if (result.structure.issues.length > 0) {
    improvements.push(...result.structure.issues.slice(0, 2))
  }

  // 質問適合の不足
  if (result.questionFit.missing.length > 0) {
    const missing = result.questionFit.missing.slice(0, 2).join('、')
    improvements.push(`不足している質問: ${missing}`)
  }

  // 概念カバレッジの不足
  if (result.coverage.missing.length > 0) {
    const missing = result.coverage.missing.slice(0, 2).join('、')
    improvements.push(`追加すべき概念: ${missing}`)
  }

  // E-E-A-Tの弱み
  if (result.eeat.weaknesses.length > 0) {
    improvements.push(...result.eeat.weaknesses.slice(0, 2))
  }

  // 最大5個まで
  return improvements.slice(0, 5)
}

/**
 * スコアから評価ランクを返す
 */
export function getScoreRank(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Poor'
  return 'Very Poor'
}
