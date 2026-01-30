/**
 * 実装ロードマップコンポーネント
 * フェーズ別の改善計画を表示
 */

import { useState } from 'react'
import {
  Map,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  Circle,
  ArrowRight,
  Calendar,
  Target,
  Layers,
} from 'lucide-react'

interface RoadmapItem {
  id: string
  title: string
  description?: string
  effort: string
  impact: string
  dependencies?: string[]
  isCompleted?: boolean
}

interface RoadmapPhase {
  id: string
  phase: string
  timeframe: string
  description?: string
  items: RoadmapItem[]
  expectedGain: string
  isActive?: boolean
}

interface ImplementationRoadmapProps {
  phases: RoadmapPhase[]
  currentPhaseId?: string
  onItemComplete?: (phaseId: string, itemId: string) => void
  completedItems?: Set<string>
}

// フェーズの色設定
const PHASE_COLORS = [
  { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
  { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100' },
  { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100' },
  { border: 'border-l-pink-500', bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100' },
]

function PhaseCard({
  phase,
  colorIndex,
  isExpanded,
  onToggle,
  completedItems,
  onItemComplete,
}: {
  phase: RoadmapPhase
  colorIndex: number
  isExpanded: boolean
  onToggle: () => void
  completedItems: Set<string>
  onItemComplete?: (phaseId: string, itemId: string) => void
}) {
  const colors = PHASE_COLORS[colorIndex % PHASE_COLORS.length]
  const completedCount = phase.items.filter(item => completedItems.has(item.id)).length
  const totalCount = phase.items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className={`border rounded-lg ${colors.border} border-l-4 overflow-hidden`}>
      {/* フェーズヘッダー */}
      <div
        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
          isExpanded ? colors.bg : ''
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronRight
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
            <div>
              <h3 className={`font-semibold ${colors.text}`}>{phase.phase}</h3>
              {phase.description && (
                <p className="text-sm text-gray-500 mt-0.5">{phase.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 期間 */}
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{phase.timeframe}</span>
            </div>

            {/* 期待効果 */}
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{phase.expectedGain}</span>
            </div>

            {/* 進捗 */}
            <div className="w-24">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{completedCount}/{totalCount}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.badge} transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 展開時のアイテムリスト */}
      {isExpanded && (
        <div className="border-t bg-white">
          <div className="p-4 space-y-3">
            {phase.items.map((item, idx) => {
              const isCompleted = completedItems.has(item.id)
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* チェックボックス */}
                  <button
                    onClick={() => onItemComplete?.(phase.id, item.id)}
                    className={`flex-shrink-0 mt-0.5 ${
                      isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* コンテンツ */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                      <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.title}
                      </h4>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}

                    {/* 依存関係 */}
                    {item.dependencies && item.dependencies.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <Layers className="w-3 h-3" />
                        <span>依存: {item.dependencies.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* メタ情報 */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{item.effort}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium">{item.impact}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function ImplementationRoadmap({
  phases,
  currentPhaseId,
  onItemComplete,
  completedItems = new Set(),
}: ImplementationRoadmapProps) {
  // 最初のフェーズをデフォルトで展開
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(phases.length > 0 ? [phases[0].id] : [])
  )

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  // 全体の統計
  const totalItems = phases.reduce((sum, p) => sum + p.items.length, 0)
  const totalCompleted = phases.reduce(
    (sum, p) => sum + p.items.filter(i => completedItems.has(i.id)).length,
    0
  )
  const overallProgress = totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0

  // 期待効果の合計
  const totalExpectedGain = phases.reduce((sum, p) => {
    const match = p.expectedGain.match(/\+(\d+)/)
    return sum + (match ? parseInt(match[1], 10) : 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-6 h-6 text-indigo-500" />
          <h2 className="text-xl font-bold text-gray-900">実装ロードマップ</h2>
        </div>

        {/* 全体進捗 */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">全体進捗</div>
            <div className="font-bold text-gray-900">
              {totalCompleted}/{totalItems} 完了
            </div>
          </div>
          <div className="w-32">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="text-lg font-bold text-indigo-700">{phases.length}</div>
                <div className="text-xs text-indigo-600">フェーズ</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="text-lg font-bold text-indigo-700">{totalItems}</div>
                <div className="text-xs text-indigo-600">改善項目</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-lg font-bold text-green-600">+{totalExpectedGain}点</div>
                <div className="text-xs text-green-600">期待改善</div>
              </div>
            </div>
          </div>

          {/* 全展開/折りたたみ */}
          <div className="flex gap-2">
            <button
              onClick={() => setExpandedPhases(new Set(phases.map(p => p.id)))}
              className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-100 rounded"
            >
              すべて展開
            </button>
            <button
              onClick={() => setExpandedPhases(new Set())}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              すべて折りたたみ
            </button>
          </div>
        </div>
      </div>

      {/* タイムライン */}
      <div className="relative">
        {/* 接続線 */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* フェーズカード */}
        <div className="space-y-4 relative">
          {phases.map((phase, idx) => (
            <div key={phase.id} className="relative pl-12">
              {/* タイムラインドット */}
              <div
                className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 ${
                  phase.id === currentPhaseId
                    ? 'bg-indigo-500 border-indigo-500'
                    : completedItems.size > 0 &&
                      phase.items.every(i => completedItems.has(i.id))
                    ? 'bg-green-500 border-green-500'
                    : 'bg-white border-gray-300'
                }`}
              />

              <PhaseCard
                phase={phase}
                colorIndex={idx}
                isExpanded={expandedPhases.has(phase.id)}
                onToggle={() => togglePhase(phase.id)}
                completedItems={completedItems}
                onItemComplete={onItemComplete}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 空状態 */}
      {phases.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>ロードマップデータがありません</p>
        </div>
      )}
    </div>
  )
}

export default ImplementationRoadmap
