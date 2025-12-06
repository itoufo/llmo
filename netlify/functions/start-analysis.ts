import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  try {
    const { url } = JSON.parse(event.body || '{}')

    if (!url || typeof url !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid URL' }) }
    }

    try {
      new URL(url)
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid URL format' }) }
    }

    // ジョブを作成
    const { data: job, error: insertError } = await supabase
      .from('analysis_jobs')
      .insert({
        url,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError || !job) {
      console.error('Failed to create job:', insertError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create analysis job' })
      }
    }

    // Background Functionを呼び出し
    const backgroundUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/analyze-background`

    fetch(backgroundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, jobId: job.id })
    }).catch(err => console.error('Background invoke error:', err))

    console.log(`[start-analysis] Created job ${job.id} for ${url}`)

    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({ jobId: job.id, status: 'pending' })
    }
  } catch (error: any) {
    console.error('[start-analysis] Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Failed to start analysis' })
    }
  }
}
