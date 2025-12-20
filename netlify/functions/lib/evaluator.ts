import OpenAI from 'openai'
import type { LLMEvaluationResult } from '../types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000  // 120秒
})

const EVALUATION_MODELS = ['gpt-5-mini', 'gpt-4o-mini']

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function evaluateWithLLM(text: string): Promise<LLMEvaluationResult> {
  const prompt = `
あなたはLLMO（AI検索最適化）の専門評価者です。
以下のWebページ本文を読み、LLM（ChatGPT、Gemini、Claudeなど）が検索回答の素材として引用したくなる度合いを評価してください。

# ページ本文
${text.slice(0, 8000)}

# 評価項目

## 1. AI引用スコア（0-100）
- LLMが回答素材として使いやすいかどうか
- 情報の明確性、構造化度、再利用性を評価

## 2. 質問対応力の評価（重要）
以下の3カテゴリで質問をリストアップしてください：

### 2-1. 現在答えられる質問（answerable）
- このページの現在の内容で十分に回答できる質問（5-10個）
- AIが引用して回答を生成できるレベルの質問

### 2-2. 部分的に答えられる質問（partial）
- 情報が不足しているが、一部は答えられる質問（3-5個）
- 何が足りないかも含めて記載

### 2-3. 改善後に答えられるようになる質問（afterImprovement）
- 提案する改善を実施すれば答えられるようになる質問（5-10個）
- 具体的で検索されやすい質問形式で記載

## 3. 概念カバレッジ（0-100）
- このテーマで一般的にカバーすべき概念をどれだけ網羅しているか
- カバー済み概念と、不足している概念をリストアップ

## 4. 構造スコア（0-100）
- 見出し階層、箇条書き、Q&A形式などLLMが読み取りやすい構造か
- 問題点を具体的に指摘

## 5. E-E-A-Tスコア（0-100）
- 専門性、経験、権威性、信頼性
- 著者情報、参考文献、更新日などの有無

## 6. 具体的な改善案（最重要）
優先度の高い順に5-8個の改善案を提案：

各改善案には必ず以下を含めること：
- **priority**: "high" / "medium" / "low"
- **category**: "structure" / "content" / "eeat" / "question" / "concept"
- **issue**: 問題点を1文で説明
- **action**: 具体的な改善アクションを1-2文で説明
- **example**: 追加すべき文章や見出しの具体例
- **enablesQuestions**: この改善で答えられるようになる質問（1-3個）

# 出力形式（JSON）

{
  "aiCitation": {
    "score": 数値(0-100),
    "comment": "評価コメント（1-2文）"
  },
  "questions": {
    "answerable": ["現在答えられる質問1", "質問2", ...],
    "partial": [
      {"question": "部分的に答えられる質問", "missing": "不足している情報"}
    ],
    "afterImprovement": ["改善後に答えられる質問1", "質問2", ...]
  },
  "questionFit": {
    "score": 数値(0-100),
    "covered": ["対応できている質問1", "質問2"],
    "missing": ["不足している質問1", "質問2"]
  },
  "coverage": {
    "score": 数値(0-100),
    "covered": ["カバー済み概念1", "概念2"],
    "missing": ["不足概念1", "概念2"]
  },
  "structure": {
    "score": 数値(0-100),
    "issues": ["問題点1", "問題点2"]
  },
  "eeat": {
    "score": 数値(0-100),
    "strengths": ["強み1", "強み2"],
    "weaknesses": ["弱み1", "弱み2"]
  },
  "improvements": [
    {
      "priority": "high",
      "category": "structure",
      "issue": "問題点の説明",
      "action": "具体的な改善アクション",
      "example": "追加すべき文章や見出しの例",
      "enablesQuestions": ["この改善で答えられるようになる質問"]
    }
  ]
}
`

  let lastError: Error | null = null

  for (const model of EVALUATION_MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[evaluateWithLLM] ${model} attempt ${attempt}/3`)

        const res = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_completion_tokens: 15000
        })

        const choice = res.choices?.[0]
        const content = choice?.message?.content

        if (!content) {
          const finishReason = choice?.finish_reason || 'unknown'
          const refusal = (choice as any)?.message?.refusal
          throw new Error(
            refusal
              ? `LLM refused to answer (${finishReason}): ${JSON.stringify(refusal)}`
              : `LLM returned empty response (finish_reason=${finishReason})`
          )
        }

        let parsed: LLMEvaluationResult
        try {
          parsed = JSON.parse(content)
        } catch (e: any) {
          throw new Error(`Failed to parse JSON response: ${e.message}`)
        }

        // スコアが範囲内であることを確認
        validateScores(parsed)

        return parsed
      } catch (error: any) {
        lastError = error
        console.warn(`[evaluateWithLLM] ${model} attempt ${attempt} failed: ${error.message}`)
        if (attempt < 3) {
          await sleep(500 * attempt)
        }
      }
    }

    console.warn(`[evaluateWithLLM] switching to fallback model`)
  }

  console.error('LLM evaluation failed after retries:', lastError)
  throw new Error(`LLM evaluation failed after retries: ${lastError?.message}`)
}

function validateScores(result: LLMEvaluationResult): void {
  const scores = [
    result.aiCitation.score,
    result.questionFit.score,
    result.coverage.score,
    result.structure.score,
    result.eeat.score
  ]

  for (const score of scores) {
    if (score < 0 || score > 100) {
      throw new Error(`Invalid score: ${score}. Scores must be between 0 and 100.`)
    }
  }
}
