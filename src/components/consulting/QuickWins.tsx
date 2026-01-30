/**
 * Quick Winsコンポーネント
 * 高効果・低工数の改善案を優先表示
 */

import { useState } from 'react'
import {
  Zap,
  Clock,
  TrendingUp,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
} from 'lucide-react'

interface QuickWinItem {
  id: string
  title: string
  description: string
  effort: string // "30分", "1時間" など
  impact: string // "+5点", "+10点" など
  category: string
  steps?: string[]
  example?: string
  metricAffected?: string
}

interface QuickWinsProps {
  items: QuickWinItem[]
  totalTimeEstimate: string
  expectedTotalGain: string
  onComplete?: (itemId: string) => void
  completedItems?: Set<string>
}

// カテゴリ表示設定
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  'meta-title': { label: 'タイトル', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'meta-description': { label: 'メタ', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  'heading-structure': { label: '見出し', color: 'text-green-700', bgColor: 'bg-green-100' },
  'alt-text': { label: '画像', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  'schema-markup': { label: '構造化', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  'question-answer-format': { label: 'Q&A', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  'summary-section': { label: '要約', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  'author-info': { label: '著者', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  'source-citation': { label: '出典', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  default: { label: '改善', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

function QuickWinCard({
  item,
  isCompleted,
  onComplete,
}: {
  item: QuickWinItem
  isCompleted: boolean
  onComplete?: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const categoryConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.default

  return (
    <div
      className={`border rounded-lg transition-all ${
        isCompleted
          ? 'bg-green-50 border-green-200 opacity-75'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      {/* ヘッダー */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryConfig.bgColor} ${categoryConfig.color}`}>
                {categoryConfig.label}
              </span>
              {item.metricAffected && (
                <span className="text-xs text-gray-400">
                  → {item.metricAffected}
                </span>
              )}
            </div>
            <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {item.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* 工数 */}
            <div className="text-center">
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{item.effort}</span>
              </div>
            </div>

            {/* 効果 */}
            <div className="text-center">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-bold">{item.impact}</span>
              </div>
            </div>

            {/* 展開ボタン */}
            <button className="p-1 hover:bg-gray-100 rounded">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 展開時の詳細 */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t">
          {/* 実装手順 */}
          {item.steps && item.steps.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                実装手順
              </h5>
              <ol className="space-y-1">
                {item.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 具体例 */}
          {item.example && (
            <div className="mt-3">
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                具体例
              </h5>
              <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap">
                {item.example}
              </div>
            </div>
          )}

          {/* 完了ボタン */}
          {onComplete && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onComplete()
                }}
                disabled={isCompleted}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    完了済み
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    完了としてマーク
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function QuickWins({
  items,
  totalTimeEstimate,
  expectedTotalGain,
  onComplete,
  completedItems = new Set(),
}: QuickWinsProps) {
  const completedCount = completedItems.size
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-bold text-gray-900">Quick Wins</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            {items.length}件
          </span>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-lg font-bold text-amber-700">{expectedTotalGain}</div>
                <div className="text-xs text-amber-600">期待スコア改善</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-lg font-bold text-amber-700">{totalTimeEstimate}</div>
                <div className="text-xs text-amber-600">合計工数</div>
              </div>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="w-48">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>進捗</span>
              <span>{completedCount}/{totalCount} 完了</span>
            </div>
            <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Winリスト */}
      <div className="space-y-3">
        {items.map((item) => (
          <QuickWinCard
            key={item.id}
            item={item}
            isCompleted={completedItems.has(item.id)}
            onComplete={onComplete ? () => onComplete(item.id) : undefined}
          />
        ))}
      </div>

      {/* 空状態 */}
      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Quick Win項目がありません</p>
          <p className="text-sm">すべての改善が中〜大規模です</p>
        </div>
      )}
    </div>
  )
}

export default QuickWins
