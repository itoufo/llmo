/**
 * 堅牢なJSONパーサー
 * - JSON修復機能（エスケープ漏れ、閉じ括弧欠落）
 * - スキーマ検証
 * - 部分復旧機能
 */

export interface ParseResult<T> {
  success: boolean
  data?: T
  errors: string[]
  recovered: boolean
  recoveryDetails?: string[]
}

/**
 * JSONを修復して解析
 */
export function parseWithRecovery<T = unknown>(
  content: string,
  validate?: (data: unknown) => data is T
): ParseResult<T> {
  const errors: string[] = []
  const recoveryDetails: string[] = []

  // 1. 標準JSON.parseを試行
  try {
    const parsed = JSON.parse(content)
    if (validate && !validate(parsed)) {
      return {
        success: false,
        errors: ['Schema validation failed'],
        recovered: false
      }
    }
    return {
      success: true,
      data: parsed as T,
      errors: [],
      recovered: false
    }
  } catch (e: any) {
    errors.push(`Initial parse failed: ${e.message}`)
  }

  // 2. JSON修復を試行
  let repaired = content

  // 2.1 制御文字の除去
  const controlCharsBefore = repaired.length
  repaired = repaired.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n' || char === '\r' || char === '\t') return char
    return ''
  })
  if (repaired.length !== controlCharsBefore) {
    recoveryDetails.push('Removed control characters')
  }

  // 2.2 末尾カンマの修正
  const trailingCommaFixed = repaired.replace(/,(\s*[}\]])/g, '$1')
  if (trailingCommaFixed !== repaired) {
    repaired = trailingCommaFixed
    recoveryDetails.push('Fixed trailing commas')
  }

  // 2.3 閉じ括弧の補完
  const openBraces = (repaired.match(/{/g) || []).length
  const closeBraces = (repaired.match(/}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/]/g) || []).length

  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces)
    recoveryDetails.push(`Added ${openBraces - closeBraces} closing braces`)
  }
  if (openBrackets > closeBrackets) {
    repaired += ']'.repeat(openBrackets - closeBrackets)
    recoveryDetails.push(`Added ${openBrackets - closeBrackets} closing brackets`)
  }

  // 2.4 切り捨てられた文字列の修正
  // 未閉じの文字列を検出して閉じる
  const truncatedStringMatch = repaired.match(/"[^"]*$/m)
  if (truncatedStringMatch) {
    repaired = repaired.replace(/"[^"]*$/m, (match) => match + '"')
    recoveryDetails.push('Closed truncated string')
  }

  // 2.5 JSONブロック抽出（マークダウンコードブロック対応）
  const jsonBlockMatch = repaired.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    repaired = jsonBlockMatch[1].trim()
    recoveryDetails.push('Extracted JSON from code block')
  }

  // 修復後に再解析
  try {
    const parsed = JSON.parse(repaired)
    if (validate && !validate(parsed)) {
      return {
        success: false,
        errors: [...errors, 'Schema validation failed after recovery'],
        recovered: true,
        recoveryDetails
      }
    }
    return {
      success: true,
      data: parsed as T,
      errors,
      recovered: true,
      recoveryDetails
    }
  } catch (e: any) {
    errors.push(`Recovery parse failed: ${e.message}`)
  }

  // 3. 最終手段: 部分的なJSON抽出
  try {
    // 最初の有効なJSONオブジェクトを探す
    const objectMatch = repaired.match(/\{[\s\S]*\}/)?.[0]
    if (objectMatch) {
      const parsed = JSON.parse(objectMatch)
      recoveryDetails.push('Extracted partial JSON object')
      if (validate && !validate(parsed)) {
        return {
          success: false,
          errors: [...errors, 'Partial extraction validation failed'],
          recovered: true,
          recoveryDetails
        }
      }
      return {
        success: true,
        data: parsed as T,
        errors,
        recovered: true,
        recoveryDetails
      }
    }
  } catch {
    errors.push('Partial extraction failed')
  }

  return {
    success: false,
    errors,
    recovered: false,
    recoveryDetails
  }
}

/**
 * LLM評価結果のバリデーター
 */
export function isValidLLMResult(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>

  // 必須フィールドチェック
  const requiredFields = ['aiCitation', 'questionFit', 'coverage', 'structure', 'eeat', 'improvements']
  for (const field of requiredFields) {
    if (!(field in obj)) {
      console.warn(`[json-parser] Missing required field: ${field}`)
      return false
    }
  }

  // スコア範囲チェック
  const scoreFields = [
    ['aiCitation', 'score'],
    ['questionFit', 'score'],
    ['coverage', 'score'],
    ['structure', 'score'],
    ['eeat', 'score']
  ]

  for (const [parent, child] of scoreFields) {
    const parentObj = obj[parent] as Record<string, unknown> | undefined
    if (parentObj && typeof parentObj[child] === 'number') {
      const score = parentObj[child] as number
      if (score < 0 || score > 100) {
        console.warn(`[json-parser] Score out of range: ${parent}.${child} = ${score}`)
        return false
      }
    }
  }

  return true
}

/**
 * スコアのデフォルト値を補完
 */
export function fillDefaultScores<T extends Record<string, any>>(data: T): T {
  const defaults = {
    aiCitation: { score: 50, comment: '評価できませんでした' },
    questionFit: { score: 50, covered: [], missing: [] },
    coverage: { score: 50, covered: [], missing: [] },
    structure: { score: 50, issues: [], strengths: [] },
    eeat: { score: 50, strengths: [], weaknesses: [] },
    questions: { answerable: [], partial: [], afterImprovement: [] },
    improvements: []
  }

  const result = { ...data }

  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (!(key in result) || result[key] === null || result[key] === undefined) {
      (result as any)[key] = defaultValue
    } else if (typeof result[key] === 'object' && typeof defaultValue === 'object') {
      (result as any)[key] = { ...defaultValue, ...result[key] }
    }
  }

  return result
}

/**
 * 矛盾検出: スコアとコメントの整合性チェック
 */
export function detectContradictions(data: Record<string, any>): string[] {
  const contradictions: string[] = []

  // 高スコアだが否定的コメント
  const negativeKeywords = ['不足', '欠如', '問題', '改善が必要', '低い', '弱い', '悪い']
  const positiveKeywords = ['優れ', '良好', '十分', '高い', '強い', '適切']

  const checkScoreCommentConsistency = (
    fieldName: string,
    score: number,
    comment: string | string[]
  ) => {
    const commentText = Array.isArray(comment) ? comment.join(' ') : comment
    if (!commentText) return

    const hasNegative = negativeKeywords.some(kw => commentText.includes(kw))
    const hasPositive = positiveKeywords.some(kw => commentText.includes(kw))

    if (score >= 70 && hasNegative && !hasPositive) {
      contradictions.push(
        `${fieldName}: 高スコア(${score})だが否定的コメント「${commentText.substring(0, 50)}...」`
      )
    }
    if (score <= 30 && hasPositive && !hasNegative) {
      contradictions.push(
        `${fieldName}: 低スコア(${score})だが肯定的コメント「${commentText.substring(0, 50)}...」`
      )
    }
  }

  // 各フィールドをチェック
  if (data.aiCitation) {
    checkScoreCommentConsistency('AI引用', data.aiCitation.score, data.aiCitation.comment)
  }
  if (data.eeat) {
    checkScoreCommentConsistency('E-E-A-T強み', data.eeat.score, data.eeat.strengths)
    checkScoreCommentConsistency('E-E-A-T弱み', data.eeat.score, data.eeat.weaknesses)
  }
  if (data.structure) {
    checkScoreCommentConsistency('構造問題', data.structure.score, data.structure.issues)
  }

  return contradictions
}
