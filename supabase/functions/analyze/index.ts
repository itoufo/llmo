import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[analyze] Starting analysis for: ${url}`)

    // 1. HTML取得（Jina Reader APIでJSレンダリング対応）
    console.log('[analyze] Fetching content via Jina Reader...')
    const content = await fetchContent(url)

    if (content.length < 100) {
      return new Response(JSON.stringify({ error: 'Content too short to analyze' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. LLM評価
    console.log('[analyze] Evaluating with LLM...')
    const llmResult = await evaluateWithLLM(content)

    // 3. スコア計算
    const overall = Math.round(
      (llmResult.aiCitation.score +
        llmResult.questionFit.score +
        llmResult.coverage.score +
        llmResult.structure.score +
        llmResult.eeat.score) / 5
    )

    const result = {
      url,
      scores: {
        aiCitation: llmResult.aiCitation.score,
        questionFit: llmResult.questionFit.score,
        coverage: llmResult.coverage.score,
        structure: llmResult.structure.score,
        eeat: llmResult.eeat.score,
        overall
      },
      improvements: llmResult.improvements || [],
      questions: llmResult.questions,
      details: {
        aiCitationComment: llmResult.aiCitation.comment,
        missingConcepts: llmResult.coverage.missing,
        coveredConcepts: llmResult.coverage.covered,
        structureIssues: llmResult.structure.issues,
        eeatStrengths: llmResult.eeat.strengths,
        eeatWeaknesses: llmResult.eeat.weaknesses
      }
    }

    // 4. Supabaseに保存
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('analyses').insert({
      url,
      ai_citation: result.scores.aiCitation,
      question_fit: result.scores.questionFit,
      coverage: result.scores.coverage,
      structure: result.scores.structure,
      eeat: result.scores.eeat,
      overall: result.scores.overall,
      improvements: result.improvements,
      raw_result: llmResult
    })

    console.log(`[analyze] Completed. Overall score: ${overall}`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('[analyze] Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function fetchContent(url: string): Promise<string> {
  // まず直接fetchを試す
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    const html = await res.text()

    // HTMLからテキスト抽出
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (textContent.length > 200) {
      console.log(`[fetch] Direct fetch successful: ${textContent.length} chars`)
      return textContent
    }
  } catch (e) {
    console.log('[fetch] Direct fetch failed, trying Jina...')
  }

  // Jina Reader APIでJSレンダリング済みコンテンツを取得
  const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
    headers: { 'Accept': 'text/plain' }
  })

  if (!jinaRes.ok) {
    throw new Error(`Failed to fetch content: ${jinaRes.status}`)
  }

  const content = await jinaRes.text()
  console.log(`[fetch] Jina fetch successful: ${content.length} chars`)
  return content
}

async function evaluateWithLLM(text: string) {
  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY')!
  })

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

  const res = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_completion_tokens: 4000
  })

  const content = res.choices[0]?.message?.content
  if (!content) {
    throw new Error('LLM returned empty response')
  }

  return JSON.parse(content)
}
