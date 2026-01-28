import { useState, useCallback } from 'react'
import {
  Map,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { SitemapResult, SitemapUrlWithStatus, AnalyzeResult } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onAnalyzeUrl: (url: string) => Promise<AnalyzeResult>
  getCachedResult: (url: string) => AnalyzeResult | null
}

const MAX_SELECTABLE = 10

export function SitemapAnalyzer({ onAnalyzeUrl, getCachedResult }: Props) {
  const { session } = useAuth()
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sitemapResult, setSitemapResult] = useState<SitemapResult | null>(null)
  const [urls, setUrls] = useState<SitemapUrlWithStatus[]>([])
  const [expanded, setExpanded] = useState(true)
  const [currentAnalyzing, setCurrentAnalyzing] = useState<string | null>(null)

  // サイトマップ取得
  const fetchSitemap = useCallback(async () => {
    if (!domain.trim()) return

    setLoading(true)
    setError(null)
    setSitemapResult(null)
    setUrls([])

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const authToken = session?.access_token || supabaseAnonKey

      const res = await fetch(`${supabaseUrl}/functions/v1/fetch-sitemap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ domain: domain.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'サイトマップの取得に失敗しました')
      }

      setSitemapResult(data)

      // URLリストを作成し、既存の診断結果をチェック
      const urlsWithStatus: SitemapUrlWithStatus[] = data.urls.map((url: any) => {
        const cached = getCachedResult(url.loc)
        return {
          ...url,
          selected: false,
          status: cached ? 'completed' : 'pending',
          score: cached?.scores?.overall,
          analyzedAt: cached ? new Date().toISOString() : undefined
        }
      })

      setUrls(urlsWithStatus)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [domain, session, getCachedResult])

  // URL選択切り替え
  const toggleUrl = (index: number) => {
    setUrls(prev => {
      const newUrls = [...prev]
      const selectedCount = newUrls.filter(u => u.selected).length

      if (!newUrls[index].selected && selectedCount >= MAX_SELECTABLE) {
        return prev // 上限到達
      }

      newUrls[index] = {
        ...newUrls[index],
        selected: !newUrls[index].selected
      }
      return newUrls
    })
  }

  // 全選択/解除
  const toggleSelectAll = () => {
    const selectedCount = urls.filter(u => u.selected).length

    if (selectedCount > 0) {
      // 全解除
      setUrls(prev => prev.map(u => ({ ...u, selected: false })))
    } else {
      // 未診断を優先して10件選択
      setUrls(prev => {
        const pending = prev.filter(u => u.status === 'pending')
        const toSelect = pending.slice(0, MAX_SELECTABLE).map(u => u.loc)
        return prev.map(u => ({
          ...u,
          selected: toSelect.includes(u.loc)
        }))
      })
    }
  }

  // 選択したURLを診断
  const analyzeSelected = async () => {
    const selected = urls.filter(u => u.selected && u.status !== 'completed')
    if (selected.length === 0) return

    setAnalyzing(true)

    for (const url of selected) {
      setCurrentAnalyzing(url.loc)

      // ステータスを更新
      setUrls(prev => prev.map(u =>
        u.loc === url.loc ? { ...u, status: 'analyzing' } : u
      ))

      try {
        const result = await onAnalyzeUrl(url.loc)

        setUrls(prev => prev.map(u =>
          u.loc === url.loc ? {
            ...u,
            status: 'completed',
            score: result.scores.overall,
            analyzedAt: new Date().toISOString(),
            selected: false
          } : u
        ))
      } catch (err: any) {
        setUrls(prev => prev.map(u =>
          u.loc === url.loc ? {
            ...u,
            status: 'error',
            error: err.message,
            selected: false
          } : u
        ))
      }
    }

    setCurrentAnalyzing(null)
    setAnalyzing(false)
  }

  const selectedCount = urls.filter(u => u.selected).length
  const completedCount = urls.filter(u => u.status === 'completed').length
  const pendingCount = urls.filter(u => u.status === 'pending').length

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* ドメイン入力 */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Map className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">サイト全体診断</h2>
            <p className="text-sm text-gray-500">サイトマップからURL一覧を取得して診断</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSitemap()}
              placeholder="example.com"
              className="input-primary pl-4"
              disabled={loading || analyzing}
            />
          </div>
          <button
            onClick={fetchSitemap}
            disabled={loading || analyzing || !domain.trim()}
            className="btn-primary px-6 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            取得
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* URL一覧 */}
      {sitemapResult && urls.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* ヘッダー */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {sitemapResult.totalFound}件のURLが見つかりました
                  </h3>
                  <p className="text-sm text-gray-500">
                    診断済み: {completedCount}件 / 未診断: {pendingCount}件
                    {sitemapResult.truncated && ` (上位${urls.length}件を表示)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {selectedCount > 0 ? '選択解除' : `未診断を選択 (最大${MAX_SELECTABLE}件)`}
                </button>
              </div>
            </div>
          </div>

          {/* URL一覧 */}
          {expanded && (
            <div className="max-h-96 overflow-y-auto">
              {urls.map((url, index) => (
                <div
                  key={url.loc}
                  className={`
                    flex items-center gap-4 px-6 py-3 border-b border-gray-50
                    hover:bg-gray-50 transition-colors
                    ${url.selected ? 'bg-indigo-50' : ''}
                    ${url.status === 'analyzing' ? 'bg-yellow-50' : ''}
                  `}
                >
                  {/* チェックボックス */}
                  <input
                    type="checkbox"
                    checked={url.selected}
                    onChange={() => toggleUrl(index)}
                    disabled={analyzing || (url.status === 'completed' && !url.selected)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300
                             focus:ring-indigo-500 disabled:opacity-50"
                  />

                  {/* URL */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 truncate">
                        {new URL(url.loc).pathname || '/'}
                      </span>
                      <a
                        href={url.loc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {url.lastmod && (
                      <span className="text-xs text-gray-400">
                        更新: {new Date(url.lastmod).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>

                  {/* ステータス */}
                  <div className="flex items-center gap-2">
                    {url.status === 'completed' && url.score !== undefined && (
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${getScoreBg(url.score)} ${getScoreColor(url.score)}
                      `}>
                        {url.score}点
                      </span>
                    )}
                    {url.status === 'analyzing' && (
                      <span className="flex items-center gap-1 text-yellow-600 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        診断中
                      </span>
                    )}
                    {url.status === 'error' && (
                      <span className="flex items-center gap-1 text-red-600 text-xs">
                        <XCircle className="w-3 h-3" />
                        エラー
                      </span>
                    )}
                    {url.status === 'pending' && (
                      <span className="text-gray-400 text-xs">未診断</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* フッター：診断ボタン */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedCount > 0 ? (
                  <span className="text-indigo-600 font-medium">
                    {selectedCount}件選択中
                  </span>
                ) : (
                  <span>診断するURLを選択してください（最大{MAX_SELECTABLE}件）</span>
                )}
              </div>
              <button
                onClick={analyzeSelected}
                disabled={selectedCount === 0 || analyzing}
                className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    診断中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    選択した{selectedCount}件を診断
                  </>
                )}
              </button>
            </div>

            {/* 診断進捗 */}
            {analyzing && currentAnalyzing && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-yellow-800">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="truncate">診断中: {currentAnalyzing}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 使い方ヒント */}
      {!sitemapResult && !loading && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
          <h3 className="font-semibold text-emerald-900 mb-3">💡 使い方</h3>
          <ol className="space-y-2 text-sm text-emerald-800">
            <li>1. ドメイン名を入力して「取得」をクリック</li>
            <li>2. サイトマップからURL一覧が表示されます</li>
            <li>3. 診断したいURLを選択（最大10件）</li>
            <li>4. 「診断」ボタンで一括診断を実行</li>
          </ol>
          <p className="mt-4 text-xs text-emerald-600">
            ※ sitemap.xml が存在するサイトのみ対応しています
          </p>
        </div>
      )}
    </div>
  )
}
