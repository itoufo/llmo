/**
 * エグゼクティブサマリーコンポーネント
 * 診断結果の経営層向けサマリー表示
 */

import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
} from 'lucide-react'

interface KeyFinding {
  icon: 'critical' | 'warning' | 'info' | 'success'
  finding: string
}

interface ExecutiveSummaryProps {
  headline: string
  keyFindings: KeyFinding[]
  overallVerdict: 'excellent' | 'good' | 'needs-improvement' | 'critical'
  scores: {
    overall: number
    llmoOverall: number
    seoOverall: number
  }
  benchmarkPercentile?: number
  improvementPotential?: number
  quickWinCount?: number
  totalEstimatedHours?: { min: number; max: number }
}

// アイコンマッピング
const ICON_MAP = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

const ICON_COLORS = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  success: 'text-green-500',
}

const ICON_BG = {
  critical: 'bg-red-50',
  warning: 'bg-amber-50',
  info: 'bg-blue-50',
  success: 'bg-green-50',
}

// 総合判定の表示設定
const VERDICT_CONFIG = {
  excellent: {
    label: '優秀',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: Award,
  },
  good: {
    label: '良好',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: CheckCircle,
  },
  'needs-improvement': {
    label: '要改善',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: AlertTriangle,
  },
  critical: {
    label: '要緊急対応',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: AlertCircle,
  },
}

export function ExecutiveSummary({
  headline,
  keyFindings,
  overallVerdict,
  scores,
  benchmarkPercentile,
  improvementPotential,
  quickWinCount,
  totalEstimatedHours,
}: ExecutiveSummaryProps) {
  const verdictConfig = VERDICT_CONFIG[overallVerdict]
  const VerdictIcon = verdictConfig.icon

  // スコアの色を決定
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  // ROI計算（改善余地/工数）
  const roi = totalEstimatedHours && improvementPotential
    ? (improvementPotential / ((totalEstimatedHours.min + totalEstimatedHours.max) / 2)).toFixed(1)
    : null

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className={`px-6 py-4 border-b ${verdictConfig.bgColor} ${verdictConfig.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VerdictIcon className={`w-6 h-6 ${verdictConfig.color}`} />
            <span className={`text-lg font-semibold ${verdictConfig.color}`}>
              {verdictConfig.label}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(scores.overall)}`}>
              {scores.overall}
              <span className="text-lg font-normal text-gray-400">/100</span>
            </div>
            <div className="text-xs text-gray-500">総合スコア</div>
          </div>
        </div>
      </div>

      {/* ヘッドライン */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <p className="text-gray-800 font-medium">{headline}</p>
      </div>

      {/* スコアカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-b">
        {/* LLMO */}
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(scores.llmoOverall)}`}>
            {scores.llmoOverall}
          </div>
          <div className="text-xs text-gray-500">LLMOスコア</div>
        </div>

        {/* SEO */}
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(scores.seoOverall)}`}>
            {scores.seoOverall}
          </div>
          <div className="text-xs text-gray-500">SEOスコア</div>
        </div>

        {/* 業界順位 */}
        {benchmarkPercentile !== undefined && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {benchmarkPercentile >= 50 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-2xl font-bold ${
                benchmarkPercentile >= 50 ? 'text-green-600' : 'text-red-600'
              }`}>
                {benchmarkPercentile >= 50
                  ? `上位${100 - benchmarkPercentile}%`
                  : `下位${100 - benchmarkPercentile}%`
                }
              </span>
            </div>
            <div className="text-xs text-gray-500">業界順位</div>
          </div>
        )}

        {/* 改善余地 */}
        {improvementPotential !== undefined && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">
                +{improvementPotential}
              </span>
            </div>
            <div className="text-xs text-gray-500">改善余地</div>
          </div>
        )}
      </div>

      {/* 主要な発見 */}
      <div className="p-6 border-b">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">主要な発見</h3>
        <div className="space-y-2">
          {keyFindings.map((finding, idx) => {
            const Icon = ICON_MAP[finding.icon]
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${ICON_BG[finding.icon]}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ICON_COLORS[finding.icon]}`} />
                <span className="text-sm text-gray-700">{finding.finding}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ROIサマリー */}
      {(quickWinCount || totalEstimatedHours || roi) && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">ROI予測</h3>
          <div className="grid grid-cols-3 gap-4">
            {quickWinCount !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{quickWinCount}</div>
                <div className="text-xs text-gray-500">Quick Win数</div>
              </div>
            )}
            {totalEstimatedHours && (
              <div className="text-center flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-xl font-bold text-gray-700">
                    {totalEstimatedHours.min}-{totalEstimatedHours.max}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">時間</span>
                </div>
              </div>
            )}
            {roi && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{roi}</div>
                <div className="text-xs text-gray-500">点/時間</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExecutiveSummary
