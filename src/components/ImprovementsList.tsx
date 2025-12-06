import { useState } from 'react'
import type { AnalyzeResult, Improvement } from '../types'

interface Props {
  result: AnalyzeResult
}

const priorityConfig = {
  high: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', label: '高' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', label: '中' },
  low: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', label: '低' }
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
  llmo: { label: 'LLMO', bg: 'bg-blue-100', text: 'text-blue-700' },
  seo: { label: 'SEO', bg: 'bg-green-100', text: 'text-green-700' },
  both: { label: 'LLMO+SEO', bg: 'bg-purple-100', text: 'text-purple-700' }
}

function ImprovementCard({ improvement, index }: { improvement: Improvement; index: number }) {
  const priority = priorityConfig[improvement.priority]
  const category = categoryConfig[improvement.category] || { label: improvement.category, icon: '📌' }
  const type = improvement.type ? typeConfig[improvement.type] : null

  return (
    <div className={`rounded-lg border-2 ${priority.border} ${priority.bg} p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-1 rounded ${priority.text} bg-white`}>
            優先度: {priority.label}
          </span>
          {type && (
            <span className={`text-xs font-bold px-2 py-1 rounded ${type.bg} ${type.text}`}>
              {type.label}
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded bg-white text-gray-600">
            {category.icon} {category.label}
          </span>
        </div>
        <span className="text-gray-400 font-bold">#{index + 1}</span>
      </div>

      <h4 className="font-bold text-gray-900 mb-2">
        {improvement.issue}
      </h4>

      <div className="bg-white rounded p-3 mb-2">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-blue-600">改善アクション：</span>
          {improvement.action}
        </p>
      </div>

      {improvement.example && (
        <div className="bg-gray-800 text-green-400 rounded p-3 text-sm font-mono mb-2">
          <p className="text-xs text-gray-400 mb-1">追加する文章・コードの例：</p>
          <p className="whitespace-pre-wrap">{improvement.example}</p>
        </div>
      )}

      {improvement.enablesQuestions && improvement.enablesQuestions.length > 0 && (
        <div className="bg-blue-100 rounded p-3 text-sm">
          <p className="text-xs text-blue-700 font-semibold mb-1">この改善で答えられるようになる質問：</p>
          <ul className="space-y-1">
            {improvement.enablesQuestions.map((q, i) => (
              <li key={i} className="text-blue-800 flex items-start">
                <span className="text-blue-500 mr-2">+</span>
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
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900">
            改善ポイント（{filteredImprovements.length}件）
          </h3>
        </div>

        {/* フィルター */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            すべて ({result.improvements.length})
          </button>
          <button
            onClick={() => setFilter('llmo')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'llmo' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            LLMO ({llmoCount})
          </button>
          <button
            onClick={() => setFilter('seo')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'seo' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            SEO ({seoCount})
          </button>
        </div>
      </div>

      {/* 優先度別サマリー */}
      <div className="flex gap-4 text-sm flex-wrap">
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold">
          高優先度: {highPriority.length}件
        </span>
        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
          中優先度: {mediumPriority.length}件
        </span>
        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
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
