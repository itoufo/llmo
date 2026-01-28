import { useState } from 'react'
import type { AnalyzeResult, Improvement } from '../types'

interface Props {
  result: AnalyzeResult
}

const priorityConfig = {
  high: { bg: 'bg-gradient-to-br from-red-50 to-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: '高', icon: '!' },
  medium: { bg: 'bg-gradient-to-br from-amber-50 to-yellow-50', border: 'border-amber-200', text: 'text-amber-700', label: '中', icon: '~' },
  low: { bg: 'bg-gradient-to-br from-sky-50 to-blue-50', border: 'border-sky-200', text: 'text-sky-700', label: '低', icon: '-' }
}

const categoryConfig: Record<string, { label: string; icon: string }> = {
  structure: { label: '構造', icon: '📐' },
  content: { label: 'コンテンツ', icon: '📝' },
  eeat: { label: 'E-E-A-T', icon: '🏆' },
  question: { label: '質問対応', icon: '❓' },
  concept: { label: '概念', icon: '💡' },
  'seo-title': { label: 'タイトル', icon: '🏷️' },
  'seo-meta': { label: 'Meta', icon: '📋' },
  'seo-heading': { label: '見出し', icon: '📑' },
  'seo-image': { label: '画像', icon: '🖼️' },
  'seo-link': { label: 'リンク', icon: '🔗' },
  'seo-schema': { label: '構造化', icon: '🔧' }
}

const typeConfig = {
  llmo: { label: 'LLMO', bg: 'bg-gradient-to-r from-indigo-100 to-blue-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  seo: { label: 'SEO', bg: 'bg-gradient-to-r from-emerald-100 to-green-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  both: { label: 'LLMO+SEO', bg: 'bg-gradient-to-r from-purple-100 to-pink-100', text: 'text-purple-700', border: 'border-purple-200' }
}

function ImprovementCard({ improvement, index }: { improvement: Improvement; index: number }) {
  // Ensure priority always has a valid value
  const validPriority = improvement.priority === 'high' || improvement.priority === 'medium' || improvement.priority === 'low' 
    ? improvement.priority 
    : 'medium'
  const priority = priorityConfig[validPriority]
  
  const category = categoryConfig[improvement.category] || { label: improvement.category, icon: '📌' }
  const type = improvement.type ? typeConfig[improvement.type] : null

  return (
    <div className={`rounded-2xl border-2 ${priority.border} ${priority.bg} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${priority.text} bg-white shadow-sm`}>
            優先度: {priority.label}
          </span>
          {type && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${type.bg} ${type.text} border ${type.border}`}>
              {type.label}
            </span>
          )}
          <span className="text-xs px-3 py-1.5 rounded-full bg-white/80 text-gray-600 shadow-sm">
            {category.icon} {category.label}
          </span>
        </div>
        <span className="text-gray-300 font-bold text-lg">#{index + 1}</span>
      </div>

      <h4 className="font-bold text-gray-900 mb-3 text-lg">
        {improvement.issue}
      </h4>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-3 border border-gray-100">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-indigo-600">改善アクション：</span>
          {improvement.action}
        </p>
      </div>

      {improvement.example && (
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 text-sm font-mono mb-3 shadow-inner">
          <p className="text-xs text-gray-400 mb-2 font-sans">追加する文章・コードの例：</p>
          <p className="whitespace-pre-wrap">{improvement.example}</p>
        </div>
      )}

      {improvement.enablesQuestions && improvement.enablesQuestions.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 text-sm border border-indigo-100">
          <p className="text-xs text-indigo-700 font-semibold mb-2">この改善で答えられるようになる質問：</p>
          <ul className="space-y-1.5">
            {improvement.enablesQuestions.map((q, i) => (
              <li key={i} className="text-indigo-800 flex items-start">
                <span className="text-indigo-400 mr-2 font-bold">+</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ImprovementsList({ result }: Props) {
  const [filter, setFilter] = useState<'all' | 'llmo' | 'seo'>('all')

  const filteredImprovements = result.improvements.filter(i => {
    if (filter === 'all') return true
    if (filter === 'llmo') return i.type === 'llmo' || i.type === 'both' || !i.type
    if (filter === 'seo') return i.type === 'seo' || i.type === 'both'
    return true
  })

  const highPriority = filteredImprovements.filter(i => i.priority === 'high')
  const mediumPriority = filteredImprovements.filter(i => i.priority === 'medium')
  const lowPriority = filteredImprovements.filter(i => i.priority === 'low')

  const llmoCount = result.improvements.filter(i => i.type === 'llmo' || i.type === 'both' || !i.type).length
  const seoCount = result.improvements.filter(i => i.type === 'seo' || i.type === 'both').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
          <h3 className="text-2xl font-bold text-gray-900">
            改善ポイント
            <span className="ml-2 text-lg font-medium text-gray-500">({filteredImprovements.length}件)</span>
          </h3>
        </div>

        {/* フィルター */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'all'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:-translate-y-0.5'
            }`}
          >
            すべて ({result.improvements.length})
          </button>
          <button
            onClick={() => setFilter('llmo')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'llmo'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 hover:-translate-y-0.5'
            }`}
          >
            LLMO ({llmoCount})
          </button>
          <button
            onClick={() => setFilter('seo')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'seo'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600 hover:-translate-y-0.5'
            }`}
          >
            SEO ({seoCount})
          </button>
        </div>
      </div>

      {/* 優先度別サマリー */}
      <div className="flex gap-3 text-sm flex-wrap">
        <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 font-semibold border border-rose-200">
          高優先度: {highPriority.length}件
        </span>
        <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 font-semibold border border-amber-200">
          中優先度: {mediumPriority.length}件
        </span>
        <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 font-semibold border border-sky-200">
          低優先度: {lowPriority.length}件
        </span>
      </div>

      {/* 改善カード一覧 */}
      <div className="space-y-4">
        {filteredImprovements.map((improvement, i) => (
          <ImprovementCard key={i} improvement={improvement} index={i} />
        ))}
      </div>

      {/* 追加情報 */}
      {result.details?.missingConcepts && result.details.missingConcepts.length > 0 && (
        <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="text-sm font-semibold text-orange-900 mb-2">
            追加すべき概念
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.details.missingConcepts.map((concept, i) => (
              <span key={i} className="bg-white text-orange-700 text-xs px-3 py-1 rounded-full border border-orange-300">
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
