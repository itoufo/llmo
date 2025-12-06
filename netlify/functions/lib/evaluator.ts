import OpenAI from 'openai'
import type { LLMEvaluationResult } from '../types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function evaluateWithLLM(text: string): Promise<LLMEvaluationResult> {
  const prompt = `
あなたはLLMO（AI検索最適化）の専門評価者です。
以下のWebページ本文を読み、LLM（ChatGPT、Gemini、Claudeなど）が検索回答の素材として引用したくなる度合いを評価してください。

# ページ本文
${text.slice(0, 8000)}

# 評価項目

1. **AI引用スコア（0-100）**
   - LLMが回答素材として使いやすいかどうか
   - 情報の明確性、構造化度、再利用性を評価
   - このページがどんな質問に答えられるかをリストアップ（3-10個）

2. **質問適合スコア（0-100）**
   - よくある質問にどれだけ答えられているか
   - 対応できている質問と、不足している質問をリストアップ

3. **概念カバレッジ（0-100）**
   - このテーマで一般的にカバーすべき概念をどれだけ網羅しているか
   - カバー済み概念と、不足している概念をリストアップ

4. **構造スコア（0-100）**
   - 見出し階層、箇条書き、Q&A形式などLLMが読み取りやすい構造か
   - 問題点を具体的に指摘（例：「結論が冒頭にない」「見出し階層が深すぎる」）

5. **E-E-A-Tスコア（0-100）**
   - 専門性（Expertise）、経験（Experience）、権威性（Authoritativeness）、信頼性（Trustworthiness）
   - 著者情報、参考文献、更新日などの有無
   - 強みと弱みをリストアップ

# 出力形式

以下のJSON形式で返してください。必ず有効なJSONとして出力してください：

{
  "aiCitation": {
    "score": 数値(0-100),
    "comment": "評価コメント（1-2文）",
    "questions": ["このページが答えられる質問1", "質問2", "質問3"]
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
  }
}
`

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    })

    const content = res.choices[0]?.message?.content
    if (!content) {
      throw new Error('LLM returned empty response')
    }

    const result = JSON.parse(content) as LLMEvaluationResult

    // スコアが範囲内であることを確認
    validateScores(result)

    return result
  } catch (error: any) {
    console.error('LLM evaluation failed:', error)
    throw new Error(`LLM evaluation failed: ${error.message}`)
  }
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
