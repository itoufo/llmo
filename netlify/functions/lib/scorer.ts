import type { LLMEvaluationResult, Improvement } from '../types'

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
 * LLM評価結果から改善案を取得
 * LLMが直接生成した具体的な改善案をそのまま返す
 */
export function getImprovements(result: LLMEvaluationResult): Improvement[] {
  // LLMが生成した改善案がある場合はそれを使用
  if (result.improvements && result.improvements.length > 0) {
    return result.improvements
  }

  // フォールバック：従来の方式で改善案を生成
  return generateFallbackImprovements(result)
}

/**
 * フォールバック用の改善案生成（LLMが改善案を返さなかった場合）
 */
function generateFallbackImprovements(result: LLMEvaluationResult): Improvement[] {
  const improvements: Improvement[] = []

  // 構造の問題点
  for (const issue of result.structure.issues.slice(0, 2)) {
    improvements.push({
      priority: 'high',
      category: 'structure',
      issue,
      action: '記事の構造を見直して修正する'
    })
  }

  // 質問適合の不足
  for (const missing of result.questionFit.missing.slice(0, 2)) {
    improvements.push({
      priority: 'medium',
      category: 'question',
      issue: `「${missing}」に対する回答がない`,
      action: `「${missing}」に答えるセクションを追加する`,
      example: `Q: ${missing}\nA: [回答を記載]`
    })
  }

  // 概念カバレッジの不足
  for (const missing of result.coverage.missing.slice(0, 2)) {
    improvements.push({
      priority: 'medium',
      category: 'concept',
      issue: `「${missing}」の概念がカバーされていない`,
      action: `「${missing}」について説明するセクションを追加する`
    })
  }

  // E-E-A-Tの弱み
  for (const weakness of result.eeat.weaknesses.slice(0, 2)) {
    improvements.push({
      priority: 'low',
      category: 'eeat',
      issue: weakness,
      action: '信頼性を高める情報を追加する'
    })
  }

  return improvements.slice(0, 6)
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
