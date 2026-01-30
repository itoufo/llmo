/**
 * ベンチマーク比較コンポーネント
 * 業界平均との比較を視覚化
 */

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  BarChart3,
} from 'lucide-react'

interface BenchmarkData {
  metric: string
  label: string
  score: number
  percentile: number
  interpretation: string
  industryAvg: number
  gap: number
  improvementPotential: number
}

interface BenchmarkComparisonProps {
  data: BenchmarkData[]
  overallPercentile: number
  overallInterpretation: string
  industryName?: string
  contentTypeName?: string
}

// 解釈の色設定
const INTERPRETATION_COLORS: Record<string, { text: string; bg: string; bar: string }> = {
  'top-10': { text: 'text-green-700', bg: 'bg-green-100', bar: '#22c55e' },
  'top-25': { text: 'text-emerald-700', bg: 'bg-emerald-100', bar: '#34d399' },
  'above-avg': { text: 'text-blue-700', bg: 'bg-blue-100', bar: '#3b82f6' },
  'average': { text: 'text-gray-700', bg: 'bg-gray-100', bar: '#9ca3af' },
  'below-avg': { text: 'text-amber-700', bg: 'bg-amber-100', bar: '#f59e0b' },
  'bottom-25': { text: 'text-orange-700', bg: 'bg-orange-100', bar: '#f97316' },
  'bottom-10': { text: 'text-red-700', bg: 'bg-red-100', bar: '#ef4444' },
}

// 解釈の日本語ラベル
const INTERPRETATION_LABELS: Record<string, string> = {
  'top-10': '上位10%',
  'top-25': '上位25%',
  'above-avg': '平均以上',
  'average': '平均付近',
  'below-avg': '平均以下',
  'bottom-25': '下位25%',
  'bottom-10': '下位10%',
}

// カスタムツールチップ
function CustomTooltip({ active, payload, label: _label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload as BenchmarkData
  if (!data) return null

  const colors = INTERPRETATION_COLORS[data.interpretation] || INTERPRETATION_COLORS['average']

  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 min-w-48">
      <p className="font-semibold text-gray-900 mb-2">{data.label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">あなたのスコア:</span>
          <span className="font-bold">{data.score}点</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">業界平均:</span>
          <span>{data.industryAvg}点</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">差分:</span>
          <span className={data.gap >= 0 ? 'text-green-600' : 'text-red-600'}>
            {data.gap > 0 ? '+' : ''}{data.gap}点
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t">
          <span className="text-gray-500">順位:</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
            {INTERPRETATION_LABELS[data.interpretation]}
          </span>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ data }: { data: BenchmarkData }) {
  const colors = INTERPRETATION_COLORS[data.interpretation] || INTERPRETATION_COLORS['average']

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{data.label}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
          {INTERPRETATION_LABELS[data.interpretation]}
        </span>
      </div>

      {/* スコアバー */}
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden mb-2">
        {/* 業界平均マーカー */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
          style={{ left: `${data.industryAvg}%` }}
        />
        {/* スコアバー */}
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${data.score}%`,
            backgroundColor: colors.bar,
          }}
        />
      </div>

      {/* 数値 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          <span className="font-bold text-gray-900">{data.score}</span>
          <span className="text-xs"> / 100</span>
        </span>
        <div className="flex items-center gap-1">
          {data.gap > 2 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : data.gap < -2 ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : (
            <Minus className="w-4 h-4 text-gray-400" />
          )}
          <span className={data.gap >= 0 ? 'text-green-600' : 'text-red-600'}>
            {data.gap > 0 ? '+' : ''}{data.gap}
          </span>
          <span className="text-gray-400 text-xs">vs 業界平均</span>
        </div>
      </div>

      {/* 改善余地 */}
      {data.improvementPotential > 5 && (
        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
          <Target className="w-3 h-3 inline mr-1" />
          改善余地: +{data.improvementPotential}点
        </div>
      )}
    </div>
  )
}

export function BenchmarkComparison({
  data,
  overallPercentile,
  overallInterpretation,
  industryName = '一般',
  contentTypeName = 'Webページ',
}: BenchmarkComparisonProps) {
  // チャート用データ
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      industryP50: d.industryAvg,
    }))
  }, [data])

  const overallColors = INTERPRETATION_COLORS[overallInterpretation] || INTERPRETATION_COLORS['average']

  // 強み・弱みの抽出
  const strengths = data.filter(d => d.percentile >= 60).sort((a, b) => b.percentile - a.percentile)
  const weaknesses = data.filter(d => d.percentile < 40).sort((a, b) => a.percentile - b.percentile)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">業界ベンチマーク比較</h2>
        </div>
        <div className="text-sm text-gray-500">
          {industryName} / {contentTypeName}
        </div>
      </div>

      {/* 総合評価カード */}
      <div className={`${overallColors.bg} border rounded-lg p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Award className={`w-12 h-12 ${overallColors.text}`} />
            <div>
              <div className="text-sm text-gray-600">業界内ポジション</div>
              <div className={`text-3xl font-bold ${overallColors.text}`}>
                {overallPercentile >= 50
                  ? `上位${100 - overallPercentile}%`
                  : `下位${100 - overallPercentile}%`
                }
              </div>
              <div className={`text-sm font-medium ${overallColors.text}`}>
                {INTERPRETATION_LABELS[overallInterpretation]}
              </div>
            </div>
          </div>

          {/* パーセンタイルバー */}
          <div className="w-64">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="relative h-4 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full">
              {/* 現在位置マーカー */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow"
                style={{ left: `calc(${overallPercentile}% - 8px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>下位</span>
              <span>平均</span>
              <span>上位</span>
            </div>
          </div>
        </div>
      </div>

      {/* 比較チャート */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">メトリクス別比較</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine x={50} stroke="#9ca3af" strokeDasharray="5 5" label="平均" />
            <Bar
              dataKey="score"
              name="あなたのスコア"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => {
                const colors = INTERPRETATION_COLORS[entry.interpretation] || INTERPRETATION_COLORS['average']
                return <Cell key={`cell-${index}`} fill={colors.bar} />
              })}
            </Bar>
            <Bar
              dataKey="industryP50"
              name="業界平均"
              fill="#d1d5db"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* メトリクスカード */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(metric => (
          <MetricCard key={metric.metric} data={metric} />
        ))}
      </div>

      {/* 強みと弱み */}
      <div className="grid grid-cols-2 gap-4">
        {/* 強み */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            強み
          </h3>
          {strengths.length > 0 ? (
            <ul className="space-y-2">
              {strengths.slice(0, 3).map(s => (
                <li key={s.metric} className="flex items-center justify-between text-sm">
                  <span className="text-green-700">{s.label}</span>
                  <span className="font-medium text-green-800">
                    {INTERPRETATION_LABELS[s.interpretation]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-600">平均以上の項目がありません</p>
          )}
        </div>

        {/* 弱み */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            要改善
          </h3>
          {weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {weaknesses.slice(0, 3).map(w => (
                <li key={w.metric} className="flex items-center justify-between text-sm">
                  <span className="text-red-700">{w.label}</span>
                  <span className="font-medium text-red-800">
                    改善余地 +{w.improvementPotential}点
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-red-600">平均以下の項目がありません</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BenchmarkComparison
