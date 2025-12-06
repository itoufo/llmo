import { useState, useEffect, useRef } from 'react'
import type { AnalyzeResult } from '../types'

interface Props {
  onResult: (result: AnalyzeResult) => void
}

type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'error'

export function UrlForm({ onResult }: Props) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<JobStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const pollingRef = useRef<number | null>(null)

  // ポーリングでジョブ状況を確認
  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'error' || status === 'idle') {
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/job-status?jobId=${jobId}`)
        const data = await res.json()

        if (data.status === 'completed' && data.result) {
          setStatus('completed')
          onResult(data.result)
          setJobId(null)
        } else if (data.status === 'error') {
          setStatus('error')
          setError(data.error || '分析に失敗しました')
          setJobId(null)
        } else {
          setStatus(data.status)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    // 2秒ごとにポーリング
    pollingRef.current = window.setInterval(checkStatus, 2000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [jobId, status, onResult])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')
    setError(null)

    try {
      const res = await fetch('/api/start-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start analysis')
      }

      setJobId(data.jobId)
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  const isLoading = status === 'pending' || status === 'processing'

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return '準備中...'
      case 'processing':
        return 'AIが分析中...'
      default:
        return '診断する'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          診断するURL
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {getStatusText()}
          </span>
        ) : (
          '診断する'
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">エラー</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </form>
  )
}
