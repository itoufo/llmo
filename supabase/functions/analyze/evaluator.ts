import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'
import { LLMEvaluationResult, LLMUsage, SEOAnalysisResult } from './types.ts'
import { createLLMOPrompt } from './prompts.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
})

export async function evaluateWithLLM(
  content: string,
  seoResult: SEOAnalysisResult
): Promise<{ result: LLMEvaluationResult; usage: LLMUsage }> {
  const prompt = createLLMOPrompt(content, seoResult)
  
  // モデル優先順位（価格とパフォーマンスを考慮）
  const models = ['gpt-4o-mini', 'gpt-3.5-turbo-0125', 'gpt-3.5-turbo']
  
  // リトライロジック（モデル切替と長さ調整付き）
  let lastError: Error | null = null

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[analyze] OpenAI ${model} attempt ${attempt}/3`)
        
        // リクエストログ
        console.log('[analyze] LLM Request:', {
          model,
          promptLength: prompt.length,
          promptPreview: prompt.substring(0, 500) + '...',
          maxTokens: 16000
        })
        
        const res = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          // LLMをフル活用してより詳細な統合評価を実施（gpt-4o-mini上限: 16384）
          max_completion_tokens: 16000
        })

        const choice = res.choices?.[0]
        const content = choice?.message?.content

        if (!content) {
          const finishReason = choice?.finish_reason || 'unknown'
          const refusal = (choice as any)?.message?.refusal
          throw new Error(
            refusal
              ? `LLM refused (${finishReason}): ${JSON.stringify(refusal)}`
              : `Empty response (finish_reason=${finishReason})`
          )
        }

        try {
          const parsedResult = JSON.parse(content)
          
          // レスポンスログ
          console.log('[analyze] LLM Response:', {
            model,
            responseLength: content.length,
            hasOverallScores: !!parsedResult.overallScores,
            hasAdvancedSeoScores: !!parsedResult.advancedSeoScores,
            scores: {
              llmoOverall: parsedResult.overallScores?.llmoOverall,
              seoOverall: parsedResult.overallScores?.seoOverall,
              advancedSeoOverall: parsedResult.overallScores?.advancedSeoOverall
            }
          })
          
          const usage: LLMUsage = {
            model,
            promptTokens: res.usage?.prompt_tokens || 0,
            completionTokens: res.usage?.completion_tokens || 0,
            totalTokens: res.usage?.total_tokens || 0
          }
          console.log(`[analyze] Token usage: ${usage.totalTokens} (prompt: ${usage.promptTokens}, completion: ${usage.completionTokens})`)
          return { result: parsedResult, usage }
        } catch (e: any) {
          throw new Error(`Failed to parse JSON: ${e.message}`)
        }
      } catch (error: any) {
        lastError = error
        console.error(`[analyze] OpenAI ${model} attempt ${attempt} failed:`, error.message)
        
        if (error.message?.includes('context_length_exceeded') || error.message?.includes('max_tokens')) {
          console.log('[analyze] Token limit exceeded, retrying with shorter content...')
          continue
        }
        
        if (attempt < 3) {
          const waitTime = attempt * 2000
          console.log(`[analyze] Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }
    
    if (model !== models[models.length - 1]) {
      console.log(`[analyze] Switching to next model...`)
    }
  }
  
  throw new Error(`LLM failed after retries: ${lastError?.message || 'Unknown error'}`)
}