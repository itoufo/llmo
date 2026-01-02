import { useState } from 'react'

interface PerformanceSeoProps {
  performanceSeo: {
    score: number
    items: {
      loadTime: { value: number; rating: 'fast' | 'moderate' | 'slow' }
      htmlSize: { value: number; rating: 'optimal' | 'heavy' | 'too-heavy' }
      inlineCSS: { count: number; excessive: boolean }
      inlineJS: { count: number; excessive: boolean }
      externalLinks: { count: number; nofollow: number; sponsored: number }
      internalLinks: { count: number; broken: number }
    }
  }
  scoreReasoning?: any
}

export function PerformanceSeoCard({ performanceSeo, scoreReasoning }: PerformanceSeoProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">⚡</span>
        パフォーマンスSEO（{performanceSeo.score}点）
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {expanded ? '詳細を閉じる' : 'スコア詳細'}
        </button>
      </h4>
      
      {/* スコア根拠 */}
      {expanded && scoreReasoning?.performance && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-1">🤖 LLMスコア算出根拠:</div>
            <div className="whitespace-pre-wrap">{scoreReasoning.performance}</div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">HTMLサイズ</span>
            <span className={performanceSeo.items.htmlSize.rating === 'optimal' ? 'text-green-600' : performanceSeo.items.htmlSize.rating === 'heavy' ? 'text-yellow-600' : 'text-red-600'}>
              {Math.round(performanceSeo.items.htmlSize.value / 1024)}KB ({performanceSeo.items.htmlSize.rating === 'optimal' ? '最適' : performanceSeo.items.htmlSize.rating === 'heavy' ? '重い' : '過重'})
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">インラインCSS</span>
            <span className={performanceSeo.items.inlineCSS.excessive ? 'text-red-600' : 'text-green-600'}>
              {performanceSeo.items.inlineCSS.count}個 ({performanceSeo.items.inlineCSS.excessive ? '多い' : 'OK'})
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">インラインJS</span>
            <span className={performanceSeo.items.inlineJS.excessive ? 'text-red-600' : 'text-green-600'}>
              {performanceSeo.items.inlineJS.count}個 ({performanceSeo.items.inlineJS.excessive ? '多い' : 'OK'})
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">外部リンク</span>
            <span className="text-gray-700">
              {performanceSeo.items.externalLinks.count}個 (nofollow: {performanceSeo.items.externalLinks.nofollow}個)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}