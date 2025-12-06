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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  try {
    const jobId = event.queryStringParameters?.jobId

    if (!jobId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing jobId' }) }
    }

    const { data: job, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Job not found' }) }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobId: job.id,
        status: job.status,
        result: job.result,
        error: job.error,
        createdAt: job.created_at,
        updatedAt: job.updated_at
      })
    }
  } catch (error: any) {
    console.error('[job-status] Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Failed to get job status' })
    }
  }
}
