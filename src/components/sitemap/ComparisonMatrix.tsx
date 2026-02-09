/**
 * 比較マトリクスコンポーネント
 * 複数URLのスコアを表形式で比較表示
 */

import { useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { buildComparisonMatrix, METRIC_LABELS } from '../../utils/sitemapTree'
import { ArrowUp, ArrowDown, Minus, Download } from 'lucide-react'

interface AnalysisResultForComparison {
  url: string
  scores: Record<string, number>
}

interface ComparisonMatrixProps {
  results: AnalysisResultForComparison[]
  highlightMetrics?: string[]
}

// メトリクスの順序定義
const METRIC_ORDER = [
  'overall',
  'aiCitation',
  'questionFit',
  'coverage',
  'structure',
  'eeat',
  'seoOverall',
]

// スコアに応じた背景色
function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-green-50 text-green-700'
  if (score >= 40) return 'bg-yellow-50 text-yellow-700'
  if (score >= 20) return 'bg-orange-50 text-orange-700'
  return 'bg-red-50 text-red-700'
}

// 平均との差分表示
function DiffIndicator({ value, average }: { value: number; average: number }) {
  const diff = value - average
  if (Math.abs(diff) < 2) {
    return <Minus className="w-3 h-3 text-gray-400" />
  }
  if (diff > 0) {
    return (
      <span className="flex items-center text-green-600 text-xs">
        <ArrowUp className="w-3 h-3" />
        {diff.toFixed(0)}
      </span>
    )
  }
  return (
    <span className="flex items-center text-red-600 text-xs">
      <ArrowDown className="w-3 h-3" />
      {Math.abs(diff).toFixed(0)}
    </span>
  )
}

export function ComparisonMatrix({
  results,
  highlightMetrics = ['overall', 'aiCitation', 'eeat'],
}: ComparisonMatrixProps) {
  // マトリクスデータ構築
  const matrix = useMemo(
    () => buildComparisonMatrix(results, METRIC_ORDER),
    [results]
  )

  // レーダーチャート用データ
  const radarData = useMemo(() => {
    return METRIC_ORDER.map((metric, metricIdx) => {
      const item: Record<string, any> = {
        metric: METRIC_LABELS[metric] || metric,
      }
      results.forEach((result, idx) => {
        item[`url${idx}`] = result.scores[metric] || 0
      })
      item.average = matrix.averages[metricIdx]
      return item
    })
  }, [results, matrix.averages])

  // URLから短い表示名を生成
  const getShortUrl = (url: string): string => {
    try {
      const parsed = new URL(url)
      const path = parsed.pathname
      if (path === '/') return 'トップ'
      const segments = path.split('/').filter(s => s)
      return '/' + segments.slice(-2).join('/')
    } catch {
      return url.slice(0, 20)
    }
  }

  // CSVエクスポート
  const exportCsv = () => {
    const headers = ['指標', ...matrix.urls.map(getShortUrl), '平均']
    const rows = matrix.metrics.map((metric, metricIdx) => [
      METRIC_LABELS[metric] || metric,
      ...matrix.data.map(row => row[metricIdx]),
      matrix.averages[metricIdx],
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'comparison_matrix.csv'
    link.click()
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        比較するURLを選択してください
      </div>
    )
  }

  // 色パレット（最大10色）
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">スコア比較</h3>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <Download className="w-4 h-4" />
          CSV出力
        </button>
      </div>

      {/* レーダーチャート */}
      {results.length >= 2 && results.length <= 5 && (
        <div className="bg-white border rounded-lg p-4">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {results.map((result, idx) => (
                <Radar
                  key={result.url}
                  name={getShortUrl(result.url)}
                  dataKey={`url${idx}`}
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* マトリクステーブル */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left font-medium text-gray-700 sticky left-0 bg-gray-50">
                  指標
                </th>
                {results.map((result, idx) => (
                  <th
                    key={result.url}
                    className="px-4 py-3 text-center font-medium"
                    style={{ color: colors[idx % colors.length] }}
                  >
                    <div className="max-w-32 truncate" title={result.url}>
                      {getShortUrl(result.url)}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-medium text-gray-500 bg-gray-100">
                  平均
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.metrics.map((metric, metricIdx) => {
                const isHighlight = highlightMetrics.includes(metric)
                return (
                  <tr
                    key={metric}
                    className={`border-b ${isHighlight ? 'bg-blue-50/30' : ''}`}
                  >
                    <td
                      className={`px-4 py-2.5 font-medium sticky left-0 ${
                        isHighlight ? 'bg-blue-50/30' : 'bg-white'
                      }`}
                    >
                      {METRIC_LABELS[metric] || metric}
                    </td>
                    {matrix.data.map((row, urlIdx) => {
                      const value = row[metricIdx]
                      const colorClass = getScoreColor(value)
                      return (
                        <td key={`${metric}-${urlIdx}`} className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`inline-flex items-center justify-center w-12 py-0.5 rounded font-medium ${colorClass}`}
                            >
                              {value}
                            </span>
                            <DiffIndicator
                              value={value}
                              average={matrix.averages[metricIdx]}
                            />
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-center bg-gray-50 font-medium text-gray-600">
                      {matrix.averages[metricIdx]}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ヒートマップ凡例 */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-50 border border-red-200" />
          0-20
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-orange-50 border border-orange-200" />
          21-40
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-50 border border-yellow-200" />
          41-60
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-50 border border-green-200" />
          61-80
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          81-100
        </span>
      </div>
    </div>
  )
}

export default ComparisonMatrix
