import { useState } from 'react'
import type { AnalyzeResult } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onResult: (result: AnalyzeResult, fromCache?: boolean) => void
  getCachedResult: (url: string) => AnalyzeResult | null
}

export function UrlForm({ onResult, getCachedResult }: Props) {
  const { session } = useAuth()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cacheHint, setCacheHint] = useState<string | null>(null)

  // Check cache when URL changes
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    setError(null)
    if (newUrl && newUrl.startsWith('http')) {
      const cached = getCachedResult(newUrl)
      if (cached) {
        setCacheHint('本日の診断結果があります')
      } else {
        setCacheHint(null)
      }
    } else {
      setCacheHint(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check cache first
    const cached = getCachedResult(url)
    if (cached) {
      onResult(cached, true)
      setLoading(false)
      return
    }

    try {
      // Supabase Edge Function を呼び出し
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      // ログイン済みの場合はセッショントークンを使用
      const authToken = session?.access_token || supabaseAnonKey

      const res = await fetch(`${supabaseUrl}/functions/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ url })
      })

      const data = await res.json()

      if (!res.ok) {
        // ステータスコードに応じたエラーメッセージ
        let errorMessage = data.error || 'Failed to analyze'
        
        // エラータイプに応じたより詳細なメッセージ
        if (res.status === 404) {
          errorMessage = '❌ ページが見つかりません。URLを確認してください。'
        } else if (res.status === 401) {
          errorMessage = '🔐 このページへのアクセスには認証が必要です。'
        } else if (res.status === 403) {
          errorMessage = '⛔ このページへのアクセスが拒否されました。'
        } else if (res.status === 502) {
          errorMessage = '🔧 サーバーエラーが発生しました。しばらく待ってから再試行してください。'
        } else if (data.error) {
          errorMessage = `⚠️ ${data.error}`
        }
        
        throw new Error(errorMessage)
      }

      onResult(data, false)
    } catch (err: any) {
      // ネットワークエラーなどの場合
      if (err.message.includes('Failed to fetch')) {
        setError('🌐 ネットワークエラーが発生しました。インターネット接続を確認してください。')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-3">
          診断するURL
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/article"
            className="input-primary pl-12"
            required
            disabled={loading}
          />
        </div>
        {cacheHint && (
          <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {cacheHint}（再診断せず結果を表示します）
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-4"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            AIが分析中...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            診断する
          </span>
        )}
      </button>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">エラーが発生しました</p>
              <p className="text-sm mt-1 text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
