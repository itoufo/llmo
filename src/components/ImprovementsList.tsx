import type { AnalyzeResult, Improvement } from '../types'

interface Props {
  result: AnalyzeResult
}

const priorityConfig = {
  high: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', label: '高' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', label: '中' },
  low: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', label: '低' }
}

const categoryConfig = {
  structure: { label: '構造', icon: '📐' },
  content: { label: 'コンテンツ', icon: '📝' },
  eeat: { label: 'E-E-A-T', icon: '🏆' },
  question: { label: '質問対応', icon: '❓' },
  concept: { label: '概念', icon: '💡' }
}

function ImprovementCard({ improvement, index }: { improvement: Improvement; index: number }) {
  const priority = priorityConfig[improvement.priority]
  const category = categoryConfig[improvement.category]

  return (
    <div className={`rounded-lg border-2 ${priority.border} ${priority.bg} p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded ${priority.text} bg-white`}>
            優先度: {priority.label}
          </span>
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
          <p className="text-xs text-gray-400 mb-1">追加する文章の例：</p>
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
  const highPriority = result.improvements.filter(i => i.priority === 'high')
  const mediumPriority = result.improvements.filter(i => i.priority === 'medium')
  const lowPriority = result.improvements.filter(i => i.priority === 'low')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900">
          改善ポイント（{result.improvements.length}件）
        </h3>
      </div>

      {/* 優先度別サマリー */}
      <div className="flex gap-4 text-sm">
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
        {result.improvements.map((improvement, i) => (
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
