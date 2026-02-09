import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { UrlForm } from './UrlForm'
import { SitemapAnalyzer } from './SitemapAnalyzer'
import { ScoreRadar } from './ScoreRadar'
import { ScoreSummary } from './ScoreSummary'
import { QuestionsList } from './QuestionsList'
import { ImprovementsList } from './ImprovementsList'
import { SeoSummary } from './SeoSummary'
import { Tooltip } from './Tooltip'
import { ExecutiveSummary } from './consulting/ExecutiveSummary'
import { QuickWins } from './consulting/QuickWins'
import { BenchmarkComparison } from './consulting/BenchmarkComparison'
import { ImplementationRoadmap } from './consulting/ImplementationRoadmap'
import { useAuth } from '../contexts/AuthContext'
import type { AnalyzeResult, HistoryStorage } from '../types'
import {
  toExecutiveSummary,
  toQuickWins,
  toBenchmarkData,
  toRoadmap,
  calculateOverallPercentile,
  getOverallInterpretation,
} from '../utils/consultingDataTransformer'

type TabType = 'single' | 'sitemap'
type ResultViewType = 'overview' | 'summary' | 'quickwins' | 'benchmark' | 'roadmap'

const HISTORY_KEY = 'llmo-doctor-history-v2'
const MAX_RESULTS_PER_PAGE = 5

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function HomePage() {
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('single')
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [historyStorage, setHistoryStorage] = useState<HistoryStorage>({ domains: {} })
  const [showHistory, setShowHistory] = useState(false)
  const [resultView, setResultView] = useState<ResultViewType>('overview')
  const [completedQuickWins, setCompletedQuickWins] = useState<Set<string>>(new Set())
  const [completedRoadmapItems, setCompletedRoadmapItems] = useState<Set<string>>(new Set())
  const resultsRef = useRef<HTMLDivElement>(null)

  // Memoized consulting data transformations
  const consultingData = useMemo(() => {
    if (!result) return null
    return {
      executiveSummary: toExecutiveSummary(result),
      quickWins: toQuickWins(result),
      benchmarkData: toBenchmarkData(result),
      roadmap: toRoadmap(result),
      overallPercentile: calculateOverallPercentile(result),
      overallInterpretation: getOverallInterpretation(result),
    }
  }, [result])

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) {
      try {
        setHistoryStorage(JSON.parse(saved))
      } catch {
        // Ignore parse errors in localStorage data
      }
    }
  }, [])

  // Check cache for same-day result
  const getCachedResult = useCallback((url: string): AnalyzeResult | null => {
    const domain = getDomain(url)
    const today = getToday()
    const pageHistory = historyStorage.domains[domain]?.pages[url]
    if (pageHistory) {
      const todayResult = pageHistory.results.find(r => r.date === today)
      if (todayResult) {
        return todayResult.result
      }
    }
    return null
  }, [historyStorage])

  // Save result to history
  const saveToHistory = useCallback((newResult: AnalyzeResult) => {
    const domain = getDomain(newResult.url)
    const today = getToday()
    const now = new Date().toISOString()

    setHistoryStorage(prev => {
      const updated = { ...prev }
      if (!updated.domains[domain]) {
        updated.domains[domain] = { domain, pages: {} }
      }
      if (!updated.domains[domain].pages[newResult.url]) {
        updated.domains[domain].pages[newResult.url] = {
          url: newResult.url,
          latestScore: newResult.scores.overall,
          results: []
        }
      }

      const page = updated.domains[domain].pages[newResult.url]
      // Remove existing same-day result
      page.results = page.results.filter(r => r.date !== today)
      // Add new result at the beginning
      page.results.unshift({
        date: today,
        analyzedAt: now,
        result: newResult
      })
      // Keep only recent results
      page.results = page.results.slice(0, MAX_RESULTS_PER_PAGE)
      page.latestScore = newResult.scores.overall

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Handle result (check cache or save new)
  const handleResult = useCallback((newResult: AnalyzeResult, isFromCache: boolean = false) => {
    setResult(newResult)
    setFromCache(isFromCache)
    if (!isFromCache) {
      saveToHistory(newResult)
    }
  }, [saveToHistory])

  // Analyze a single URL (for SitemapAnalyzer)
  const analyzeUrl = useCallback(async (url: string): Promise<AnalyzeResult> => {
    // Check cache first
    const cached = getCachedResult(url)
    if (cached) {
      return cached
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
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
      throw new Error(data.error || 'Failed to analyze')
    }

    // Save to history
    saveToHistory(data)
    return data
  }, [session, getCachedResult, saveToHistory])

  // Get domain list for display
  const domainList = Object.values(historyStorage.domains).sort((a, b) => {
    const aLatest = Math.max(...Object.values(a.pages).flatMap(p => p.results.map(r => new Date(r.analyzedAt).getTime())))
    const bLatest = Math.max(...Object.values(b.pages).flatMap(p => p.results.map(r => new Date(r.analyzedAt).getTime())))
    return bLatest - aLatest
  })

  const exportAsPDF = () => {
    if (!result || !resultsRef.current) return
    // Use browser native print for vector-quality PDF output
    // Text remains as text (not rasterized), so it's crisp at any zoom level
    document.title = `llmo-doctor-report-${new Date().toISOString().slice(0, 10)}`
    window.print()
  }

  const exportAsJSON = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `llmo-doctor-report-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsCSV = () => {
    if (!result) return
    const rows = [
      ['診断URL', result.url],
      ['診断日時', new Date().toLocaleString('ja-JP')],
      [''],
      ['=== スコア ==='],
      ['総合スコア', result.scores.overall],
      ['LLMOスコア', result.scores.llmoOverall || ''],
      ['SEOスコア', result.scores.seoOverall || ''],
      ['AI引用', result.scores.aiCitation],
      ['質問適合', result.scores.questionFit],
      ['概念カバレッジ', result.scores.coverage],
      ['構造', result.scores.structure],
      ['E-E-A-T', result.scores.eeat],
      [''],
      ['=== 改善ポイント ==='],
      ['優先度', 'カテゴリ', 'タイプ', '問題', 'アクション'],
      ...result.improvements.map(i => [i.priority, i.category, i.type || '', i.issue, i.action]),
      [''],
      ['=== 回答可能な質問 ==='],
      ...(result.questions?.answerable || []).map(q => [q]),
    ]
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `llmo-doctor-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-14 animate-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-5 tracking-tight">
          LLMO Doctor
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
          URLを入力するだけで、AIが引用したくなる度 + SEO最適化度をスコア化
        </p>
        <p className="text-sm text-gray-500 mt-3 max-w-xl mx-auto">
          LLM（ChatGPT / Gemini / Claude等）と検索エンジン両方に最適化されたコンテンツか診断します
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6 animate-in-delayed">
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => { setActiveTab('single'); setResult(null); }}
            className={`
              px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === 'single'
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              単一URL診断
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('sitemap'); setResult(null); }}
            className={`
              px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === 'sitemap'
                ? 'bg-white text-emerald-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              サイト全体診断
            </span>
          </button>
        </div>
      </div>

      {/* Input Form */}
      {activeTab === 'single' ? (
      <div className="card-elevated p-8 mb-10 animate-in-delayed">
        <UrlForm
          onResult={handleResult}
          getCachedResult={getCachedResult}
        />
        {/* History toggle */}
        {domainList.length > 0 && !result && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              診断履歴 ({domainList.length}ドメイン)
              <svg className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showHistory && (
              <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                {domainList.map(domainHistory => (
                  <div key={domainHistory.domain} className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                      {domainHistory.domain}
                      <span className="text-xs text-gray-400">
                        ({Object.keys(domainHistory.pages).length}ページ)
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Object.values(domainHistory.pages)
                        .sort((a, b) => {
                          const aTime = new Date(a.results[0]?.analyzedAt || 0).getTime()
                          const bTime = new Date(b.results[0]?.analyzedAt || 0).getTime()
                          return bTime - aTime
                        })
                        .map(page => {
                          const latestResult = page.results[0]
                          if (!latestResult) return null
                          const isToday = latestResult.date === getToday()
                          return (
                            <div
                              key={page.url}
                              className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 hover:bg-indigo-50 transition-colors cursor-pointer group"
                              onClick={() => handleResult(latestResult.result, true)}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-600 truncate block" title={page.url}>
                                  {page.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                </span>
                                {page.results.length > 1 && (
                                  <span className="text-xs text-gray-400">
                                    {page.results.length}件の履歴
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-2">
                                <span className="font-bold text-indigo-600">{page.latestScore}</span>
                                <span className={`text-xs ${isToday ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
                                  {isToday ? '今日' : new Date(latestResult.analyzedAt).toLocaleDateString('ja-JP')}
                                </span>
                                <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      ) : (
        <div className="mb-10 animate-in-delayed">
          <SitemapAnalyzer
            onAnalyzeUrl={analyzeUrl}
            getCachedResult={getCachedResult}
          />
        </div>
      )}

      {/* Results */}
      {result && (
        <div ref={resultsRef} data-print-area className="space-y-8 animate-in">
          {/* Result View Tabs */}
          <div data-no-print className="flex justify-center">
            <div className="inline-flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 gap-1">
              {[
                { id: 'overview' as const, label: '診断結果', icon: '📊' },
                { id: 'summary' as const, label: 'サマリー', icon: '📋' },
                { id: 'quickwins' as const, label: 'Quick Wins', icon: '⚡' },
                { id: 'benchmark' as const, label: 'ベンチマーク', icon: '📈' },
                { id: 'roadmap' as const, label: 'ロードマップ', icon: '🗺️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setResultView(tab.id)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${resultView === tab.id
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Executive Summary View */}
          {resultView === 'summary' && consultingData && (
            <ExecutiveSummary {...consultingData.executiveSummary} />
          )}

          {/* Quick Wins View */}
          {resultView === 'quickwins' && consultingData && (
            <QuickWins
              items={consultingData.quickWins.items}
              totalTimeEstimate={consultingData.quickWins.totalTimeEstimate}
              expectedTotalGain={consultingData.quickWins.expectedTotalGain}
              onComplete={(itemId) => {
                setCompletedQuickWins(prev => {
                  const next = new Set(prev)
                  if (next.has(itemId)) {
                    next.delete(itemId)
                  } else {
                    next.add(itemId)
                  }
                  return next
                })
              }}
              completedItems={completedQuickWins}
            />
          )}

          {/* Benchmark Comparison View */}
          {resultView === 'benchmark' && consultingData && (
            <BenchmarkComparison
              data={consultingData.benchmarkData}
              overallPercentile={consultingData.overallPercentile}
              overallInterpretation={consultingData.overallInterpretation}
            />
          )}

          {/* Roadmap View */}
          {resultView === 'roadmap' && consultingData && (
            <ImplementationRoadmap
              phases={consultingData.roadmap}
              onItemComplete={(phaseId, itemId) => {
                setCompletedRoadmapItems(prev => {
                  const next = new Set(prev)
                  const key = `${phaseId}:${itemId}`
                  if (next.has(key)) {
                    next.delete(key)
                  } else {
                    next.add(key)
                  }
                  return next
                })
              }}
              completedItems={completedRoadmapItems}
            />
          )}

          {/* Overview (Original Detail View) */}
          {resultView === 'overview' && (
            <>
          {/* Overall Score */}
          <div className="card-elevated p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="inline-block">
                <div className="relative">
                  <div className="text-8xl sm:text-9xl font-extrabold text-gradient leading-none">
                    {result.scores.overall}
                  </div>
                  <div className="absolute -top-2 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="text-gray-600 font-semibold mt-3 text-lg">総合スコア</div>

                {/* LLMO + SEO スコア表示 */}
                {result.scores.llmoOverall !== undefined && result.scores.seoOverall !== undefined && (
                  <div className="flex justify-center gap-6 mt-6">
                    <div className="px-6 py-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
                      <div className="text-3xl font-bold text-gradient-blue">{result.scores.llmoOverall}</div>
                      <div className="text-sm text-indigo-600 font-medium mt-1">LLMO</div>
                    </div>
                    <div className="px-6 py-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                      <div className="text-3xl font-bold text-emerald-600">{result.scores.seoOverall}</div>
                      <div className="text-sm text-emerald-600 font-medium mt-1">SEO</div>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500 mt-6 px-4 py-2 bg-gray-50 rounded-full inline-block">
                  診断URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline break-all font-medium">{result.url}</a>
                </div>

                {/* Cache indicator */}
                {fromCache && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs border border-amber-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    履歴から復元（本日の診断結果）
                  </div>
                )}

                {/* Token usage & Cost */}
                {result.usage && (
                  <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
                    <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                      <span className="font-medium">{result.usage.totalTokens.toLocaleString()}</span> tokens
                      <span className="text-amber-500 ml-1">
                        (in: {result.usage.promptTokens.toLocaleString()} / out: {result.usage.completionTokens.toLocaleString()})
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                      <span className="font-medium">${result.usage.cost.total.toFixed(4)}</span>
                      <span className="text-emerald-500 ml-1">({result.usage.model})</span>
                    </div>
                  </div>
                )}
                {result.details?.aiCitationComment && (
                  <div className="mt-6 text-sm text-gray-600 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 max-w-xl mx-auto border border-indigo-100">
                    {result.details.aiCitationComment}
                  </div>
                )}
              </div>
            </div>

            {/* LLMO詳細 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gradient-blue mb-6 flex items-center justify-center sm:justify-start">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mr-3 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                LLMO診断
                <Tooltip text="LLMO（LLM Optimization）= AIチャットボット（ChatGPT、Gemini、Claude等）があなたのコンテンツを引用・参照しやすくするための最適化指標です" />
              </h2>
              <ScoreSummary result={result} />
            </div>
            <div className="pt-8 border-t border-gray-100 mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">スコア分布</h2>
              <ScoreRadar result={result} />
            </div>

            {/* SEO詳細 */}
            {result.seo && (result.scores.seoOverall !== undefined || result.seo.seoOverallScore !== undefined) && (
              <div className="pt-8 border-t border-gray-100">
                <SeoSummary seo={result.seo} seoOverall={result.scores.seoOverall || result.seo.seoOverallScore || 0} />
              </div>
            )}
          </div>

          {/* Questions */}
          {result.questions && (
            <div className="card-elevated p-8 card-hover">
              <QuestionsList result={result} />
            </div>
          )}

          {/* Improvements */}
          <div className="card-elevated p-8 card-hover">
            <ImprovementsList result={result} />
          </div>
            </>
          )}

          {/* Footer Actions - shown for all result views */}
          <div data-no-print className="flex flex-col items-center gap-5">
            {/* Export buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={exportAsPDF}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100 text-rose-700 font-medium rounded-xl transition-all duration-300 text-sm border border-rose-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                PDF
              </button>
              <button
                onClick={exportAsJSON}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 font-medium rounded-xl transition-all duration-300 text-sm border border-indigo-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                JSON
              </button>
              <button
                onClick={exportAsCSV}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 font-medium rounded-xl transition-all duration-300 text-sm border border-emerald-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
            </div>
            <button
              onClick={() => {
                setResult(null)
                setResultView('overview')
                setCompletedQuickWins(new Set())
                setCompletedRoadmapItems(new Set())
              }}
              className="btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              別のURLを診断する
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-gray-500 border border-gray-100">
          <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
          Powered by OpenAI GPT | Built with Vite, React, Supabase Edge Functions
        </div>
      </div>
    </div>
  )
}