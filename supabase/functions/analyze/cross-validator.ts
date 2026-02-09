/**
 * マルチLLMクロスバリデーションモジュール
 * - Primary: GPT-4o-mini（高速・低コスト）
 * - Validation: GPT-4o（高精度・検証用）
 * - Consensus: 差分が大きい場合の仲裁
 */

import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'
import { LLMEvaluationResult, LLMUsage, SEOAnalysisResult } from './types.ts'
import { createLLMOPrompt } from './prompts.ts'
import { parseWithRecovery, detectContradictions, fillDefaultScores, isValidLLMResult } from './json-parser.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
})

export interface CrossValidationConfig {
  enabled: boolean
  divergenceThreshold: number // スコア差分の許容閾値（デフォルト: 15）
  primaryModel: string
  validationModel: string
  arbitrationModel: string
}

export interface CrossValidationResult {
  result: LLMEvaluationResult
  usage: LLMUsage
  validation: {
    performed: boolean
    divergenceDetected: boolean
    primaryScores?: Record<string, number>
    validationScores?: Record<string, number>
    scoreDivergences?: Record<string, number>
    reasoningContradictions: string[]
    consensusMethod?: 'primary' | 'validation' | 'weighted' | 'arbitration'
    confidence: number
  }
}

const DEFAULT_CONFIG: CrossValidationConfig = {
  enabled: true,
  divergenceThreshold: 15,
  primaryModel: 'gpt-4o-mini',
  validationModel: 'gpt-4o',
  arbitrationModel: 'gpt-4o'
}

/**
 * 単一モデルでLLM評価を実行
 */
async function evaluateSingleModel(
  content: string,
  seoResult: SEOAnalysisResult,
  model: string,
  maxRetries: number = 3
): Promise<{ result: LLMEvaluationResult; usage: LLMUsage } | null> {
  const prompt = createLLMOPrompt(content, seoResult)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[cross-validator] ${model} attempt ${attempt}/${maxRetries}`)

      const res = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_completion_tokens: 16000
      })

      const responseContent = res.choices?.[0]?.message?.content
      if (!responseContent) {
        throw new Error('Empty response from LLM')
      }

      // 堅牢なJSONパース
      const parseResult = parseWithRecovery<LLMEvaluationResult>(responseContent, (data): data is LLMEvaluationResult => isValidLLMResult(data))

      if (!parseResult.success) {
        throw new Error(`JSON parse failed: ${parseResult.errors.join(', ')}`)
      }

      if (parseResult.recovered) {
        console.warn(`[cross-validator] JSON recovered: ${parseResult.recoveryDetails?.join(', ')}`)
      }

      const result = fillDefaultScores(parseResult.data!)

      const usage: LLMUsage = {
        model,
        promptTokens: res.usage?.prompt_tokens || 0,
        completionTokens: res.usage?.completion_tokens || 0,
        totalTokens: res.usage?.total_tokens || 0
      }

      return { result, usage }
    } catch (error: any) {
      console.error(`[cross-validator] ${model} attempt ${attempt} failed:`, error.message)

      if (attempt < maxRetries) {
        const waitTime = attempt * 2000
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  return null
}

/**
 * スコアを抽出
 */
function extractScores(result: LLMEvaluationResult): Record<string, number> {
  return {
    aiCitation: result.aiCitation?.score || 0,
    questionFit: result.questionFit?.score || 0,
    coverage: result.coverage?.score || 0,
    structure: result.structure?.score || 0,
    eeat: result.eeat?.score || 0,
    technicalSeo: result.advancedSeoScores?.technicalSeo || 0,
    performanceSeo: result.advancedSeoScores?.performanceSeo || 0,
    contentSeo: result.advancedSeoScores?.contentSeo || 0,
    userExperience: result.advancedSeoScores?.userExperience || 0
  }
}

/**
 * スコア乖離を計算
 */
function calculateDivergences(
  primary: Record<string, number>,
  validation: Record<string, number>
): { divergences: Record<string, number>; maxDivergence: number } {
  const divergences: Record<string, number> = {}
  let maxDivergence = 0

  for (const key of Object.keys(primary)) {
    const diff = Math.abs(primary[key] - validation[key])
    divergences[key] = diff
    if (diff > maxDivergence) {
      maxDivergence = diff
    }
  }

  return { divergences, maxDivergence }
}

/**
 * 推論矛盾を検出
 */
function detectReasoningContradictions(
  primary: LLMEvaluationResult,
  validation: LLMEvaluationResult
): string[] {
  const contradictions: string[] = []

  // 各フィールドの矛盾をチェック
  const primaryContradictions = detectContradictions(primary as Record<string, any>)
  const validationContradictions = detectContradictions(validation as Record<string, any>)

  contradictions.push(...primaryContradictions.map(c => `[Primary] ${c}`))
  contradictions.push(...validationContradictions.map(c => `[Validation] ${c}`))

  // 両モデル間の矛盾（スコア差が大きいのに理由が似ている等）
  const scoreDiff = Math.abs(
    (primary.aiCitation?.score || 0) - (validation.aiCitation?.score || 0)
  )
  if (scoreDiff > 20) {
    const primaryComment = primary.aiCitation?.comment || ''
    const validationComment = validation.aiCitation?.comment || ''
    if (primaryComment.substring(0, 30) === validationComment.substring(0, 30)) {
      contradictions.push(
        `AI引用スコアが${scoreDiff}点異なるが、コメントが類似`
      )
    }
  }

  return contradictions
}

/**
 * コンセンサスを構築
 */
function buildConsensus(
  primary: LLMEvaluationResult,
  validation: LLMEvaluationResult,
  divergences: Record<string, number>,
  threshold: number
): { result: LLMEvaluationResult; method: 'primary' | 'validation' | 'weighted' } {
  // 乖離が小さい場合はprimaryを採用
  const maxDiv = Math.max(...Object.values(divergences))
  if (maxDiv <= threshold * 0.5) {
    return { result: primary, method: 'primary' }
  }

  // 乖離が中程度の場合は加重平均
  if (maxDiv <= threshold) {
    const merged = mergeResults(primary, validation, 0.6, 0.4)
    return { result: merged, method: 'weighted' }
  }

  // 乖離が大きい場合はvalidationを優先（より精度が高いモデル）
  return { result: validation, method: 'validation' }
}

/**
 * 結果をマージ（加重平均）
 */
function mergeResults(
  primary: LLMEvaluationResult,
  validation: LLMEvaluationResult,
  primaryWeight: number,
  validationWeight: number
): LLMEvaluationResult {
  const mergeScore = (p: number, v: number) =>
    Math.round(p * primaryWeight + v * validationWeight)

  return {
    ...primary,
    aiCitation: {
      score: mergeScore(primary.aiCitation?.score || 0, validation.aiCitation?.score || 0),
      comment: validation.aiCitation?.comment || primary.aiCitation?.comment || ''
    },
    questionFit: {
      score: mergeScore(primary.questionFit?.score || 0, validation.questionFit?.score || 0),
      covered: [...new Set([...(primary.questionFit?.covered || []), ...(validation.questionFit?.covered || [])])],
      missing: [...new Set([...(primary.questionFit?.missing || []), ...(validation.questionFit?.missing || [])])]
    },
    coverage: {
      score: mergeScore(primary.coverage?.score || 0, validation.coverage?.score || 0),
      covered: [...new Set([...(primary.coverage?.covered || []), ...(validation.coverage?.covered || [])])],
      missing: [...new Set([...(primary.coverage?.missing || []), ...(validation.coverage?.missing || [])])]
    },
    structure: {
      score: mergeScore(primary.structure?.score || 0, validation.structure?.score || 0),
      issues: [...new Set([...(primary.structure?.issues || []), ...(validation.structure?.issues || [])])],
      strengths: [...new Set([...(primary.structure?.strengths || []), ...(validation.structure?.strengths || [])])]
    },
    eeat: {
      score: mergeScore(primary.eeat?.score || 0, validation.eeat?.score || 0),
      strengths: [...new Set([...(primary.eeat?.strengths || []), ...(validation.eeat?.strengths || [])])],
      weaknesses: [...new Set([...(primary.eeat?.weaknesses || []), ...(validation.eeat?.weaknesses || [])])]
    },
    advancedSeoScores: primary.advancedSeoScores && validation.advancedSeoScores ? {
      ...primary.advancedSeoScores,
      technicalSeo: mergeScore(primary.advancedSeoScores.technicalSeo, validation.advancedSeoScores.technicalSeo),
      performanceSeo: mergeScore(primary.advancedSeoScores.performanceSeo, validation.advancedSeoScores.performanceSeo),
      contentSeo: mergeScore(primary.advancedSeoScores.contentSeo, validation.advancedSeoScores.contentSeo),
      userExperience: mergeScore(primary.advancedSeoScores.userExperience, validation.advancedSeoScores.userExperience)
    } : primary.advancedSeoScores,
    // 改善案は両方をマージして重複除去
    improvements: mergeImprovements(primary.improvements, validation.improvements)
  }
}

/**
 * 改善案をマージ
 */
function mergeImprovements(
  primary: LLMEvaluationResult['improvements'],
  validation: LLMEvaluationResult['improvements']
): LLMEvaluationResult['improvements'] {
  const seen = new Set<string>()
  const merged: LLMEvaluationResult['improvements'] = []

  for (const imp of [...(primary || []), ...(validation || [])]) {
    const key = `${imp.category}:${imp.issue.substring(0, 50)}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(imp)
    }
  }

  // 優先度でソート
  return merged.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
  })
}

/**
 * クロスバリデーション付きLLM評価を実行
 */
export async function evaluateWithCrossValidation(
  content: string,
  seoResult: SEOAnalysisResult,
  config: Partial<CrossValidationConfig> = {}
): Promise<CrossValidationResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Primary評価
  console.log('[cross-validator] Running primary evaluation...')
  const primaryResult = await evaluateSingleModel(content, seoResult, cfg.primaryModel)

  if (!primaryResult) {
    throw new Error('Primary evaluation failed')
  }

  // クロスバリデーションが無効の場合はprimaryのみ返却
  if (!cfg.enabled) {
    return {
      result: primaryResult.result,
      usage: primaryResult.usage,
      validation: {
        performed: false,
        divergenceDetected: false,
        reasoningContradictions: [],
        confidence: 0.7
      }
    }
  }

  // Validation評価
  console.log('[cross-validator] Running validation evaluation...')
  const validationResult = await evaluateSingleModel(content, seoResult, cfg.validationModel)

  if (!validationResult) {
    // Validationが失敗してもprimaryを返却
    console.warn('[cross-validator] Validation failed, using primary result only')
    return {
      result: primaryResult.result,
      usage: primaryResult.usage,
      validation: {
        performed: false,
        divergenceDetected: false,
        reasoningContradictions: [],
        confidence: 0.7
      }
    }
  }

  // スコア抽出と乖離計算
  const primaryScores = extractScores(primaryResult.result)
  const validationScores = extractScores(validationResult.result)
  const { divergences, maxDivergence } = calculateDivergences(primaryScores, validationScores)

  // 推論矛盾検出
  const reasoningContradictions = detectReasoningContradictions(
    primaryResult.result,
    validationResult.result
  )

  // 乖離が閾値を超えた場合
  const divergenceDetected = maxDivergence > cfg.divergenceThreshold

  if (divergenceDetected) {
    console.warn(`[cross-validator] Score divergence detected (max: ${maxDivergence})`)
  }

  // コンセンサス構築
  const { result: consensusResult, method } = buildConsensus(
    primaryResult.result,
    validationResult.result,
    divergences,
    cfg.divergenceThreshold
  )

  // 使用量を合算
  const totalUsage: LLMUsage = {
    model: `${cfg.primaryModel}+${cfg.validationModel}`,
    promptTokens: primaryResult.usage.promptTokens + validationResult.usage.promptTokens,
    completionTokens: primaryResult.usage.completionTokens + validationResult.usage.completionTokens,
    totalTokens: primaryResult.usage.totalTokens + validationResult.usage.totalTokens
  }

  // 信頼度計算
  const confidence = divergenceDetected
    ? Math.max(0.5, 1 - maxDivergence / 100)
    : Math.min(1, 0.85 + (1 - maxDivergence / cfg.divergenceThreshold) * 0.15)

  return {
    result: consensusResult,
    usage: totalUsage,
    validation: {
      performed: true,
      divergenceDetected,
      primaryScores,
      validationScores,
      scoreDivergences: divergences,
      reasoningContradictions,
      consensusMethod: method,
      confidence: Math.round(confidence * 100) / 100
    }
  }
}

/**
 * 従来のevaluateWithLLM互換インターフェース
 */
export async function evaluateWithLLMEnhanced(
  content: string,
  seoResult: SEOAnalysisResult,
  enableCrossValidation: boolean = true
): Promise<{ result: LLMEvaluationResult; usage: LLMUsage; validation?: CrossValidationResult['validation'] }> {
  const crossResult = await evaluateWithCrossValidation(content, seoResult, {
    enabled: enableCrossValidation
  })

  return {
    result: crossResult.result,
    usage: crossResult.usage,
    validation: crossResult.validation
  }
}
