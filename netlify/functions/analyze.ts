import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { fetchHTML } from './lib/fetcher'
import { extractMainContent } from './lib/extractor'
import { evaluateWithLLM } from './lib/evaluator'
import { calculateOverallScore, getImprovements } from './lib/scorer'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const handler: Handler = async (event) => {
  // CORSヘッダー
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // プリフライトリクエストの処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    const { url } = JSON.parse(event.body || '{}')

    if (!url || typeof url !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL' })
      }
    }

    // URLフォーマット検証
    try {
      new URL(url)
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL format' })
      }
    }

    console.log(`[analyze] Starting analysis for: ${url}`)

    // 1. HTML取得
    console.log('[analyze] Fetching HTML...')
    const html = await fetchHTML(url)

    // 2. 本文抽出
    console.log('[analyze] Extracting content...')
    const text = extractMainContent(html)

    if (text.length < 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content too short to analyze (minimum 100 characters)' })
      }
    }

    // 3. LLM評価
    console.log('[analyze] Evaluating with LLM...')
    const llmResult = await evaluateWithLLM(text)

    // 4. スコア計算
    console.log('[analyze] Calculating scores...')
    const overall = calculateOverallScore(llmResult)
    const improvements = getImprovements(llmResult)

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
      improvements,
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

    // 5. Supabaseに保存
    console.log('[analyze] Saving to database...')
    const { error: dbError } = await supabase.from('analyses').insert({
      url,
      ai_citation: result.scores.aiCitation,
      question_fit: result.scores.questionFit,
      coverage: result.scores.coverage,
      structure: result.scores.structure,
      eeat: result.scores.eeat,
      overall: result.scores.overall,
      improvements,
      raw_result: llmResult
    })

    if (dbError) {
      console.error('[analyze] Database error:', dbError)
      // DB保存失敗してもレスポンスは返す
    }

    console.log(`[analyze] Analysis completed successfully. Overall score: ${overall}`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }
  } catch (error: any) {
    console.error('[analyze] Analysis failed:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Analysis failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}
