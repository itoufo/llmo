import type { BackgroundHandler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { fetchHTML } from './lib/fetcher'
import { extractMainContent } from './lib/extractor'
import { evaluateWithLLM } from './lib/evaluator'
import { calculateOverallScore, getImprovements } from './lib/scorer'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const handler: BackgroundHandler = async (event) => {
  const { url, jobId } = JSON.parse(event.body || '{}')

  console.log(`[background] Starting analysis job ${jobId} for: ${url}`)

  try {
    // ステータス更新: processing
    await supabase.from('analysis_jobs').update({
      status: 'processing',
      updated_at: new Date().toISOString()
    }).eq('id', jobId)

    // 1. HTML取得
    console.log('[background] Fetching HTML...')
    const html = await fetchHTML(url)

    // 2. 本文抽出
    console.log('[background] Extracting content...')
    const text = extractMainContent(html)

    if (text.length < 100) {
      await supabase.from('analysis_jobs').update({
        status: 'error',
        error: 'Content too short to analyze',
        updated_at: new Date().toISOString()
      }).eq('id', jobId)
      return
    }

    // 3. LLM評価
    console.log('[background] Evaluating with LLM...')
    const llmResult = await evaluateWithLLM(text)

    // 4. スコア計算
    console.log('[background] Calculating scores...')
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

    // 5. 結果をSupabaseに保存
    console.log('[background] Saving result...')
    await supabase.from('analysis_jobs').update({
      status: 'completed',
      result,
      updated_at: new Date().toISOString()
    }).eq('id', jobId)

    // analysesテーブルにも保存
    await supabase.from('analyses').insert({
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

    console.log(`[background] Job ${jobId} completed successfully`)
  } catch (error: any) {
    console.error(`[background] Job ${jobId} failed:`, error)
    await supabase.from('analysis_jobs').update({
      status: 'error',
      error: error.message || 'Analysis failed',
      updated_at: new Date().toISOString()
    }).eq('id', jobId)
  }
}
