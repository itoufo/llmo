/**
 * トレンドチャートコンポーネント
 * スコアの経時変化を表示
 */

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'

interface TrendDataPoint {
  date: string
  score: number
  urlCount?: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
  title?: string
  targetScore?: number
  showTrend?: boolean
}

// 日付をフォーマット
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 日付を詳細フォーマット
function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

// トレンド計算（線形回帰の傾き）
function calculateTrend(data: TrendDataPoint[]): number {
  if (data.length < 2) return 0

  const n = data.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  data.forEach((point, i) => {
    sumX += i
    sumY += point.score
    sumXY += i * point.score
    sumX2 += i * i
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

// カスタムツールチップ
function CustomTooltip({ active, payload, label: _label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload as TrendDataPoint
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900">
        {formatDateFull(data.date)}
      </p>
      <p className="text-lg font-bold text-blue-600">{data.score}点</p>
      {data.urlCount !== undefined && (
        <p className="text-xs text-gray-500">分析URL数: {data.urlCount}</p>
      )}
    </div>
  )
}

export function TrendChart({
  data,
  title = 'スコア推移',
  targetScore,
  showTrend = true,
}: TrendChartProps) {
  // トレンド計算
  const trend = useMemo(() => calculateTrend(data), [data])
  const trendPerWeek = trend * 7 // 1週間あたりの変化

  // 統計
  const stats = useMemo(() => {
    if (data.length === 0) return null

    const scores = data.map(d => d.score)
    const latest = scores[scores.length - 1]
    const first = scores[0]
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const change = latest - first

    return { latest, first, max, min, avg, change }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        履歴データがありません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          {title}
        </h3>
        {stats && showTrend && (
          <div className="flex items-center gap-4">
            {/* トレンド表示 */}
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                trendPerWeek > 0.5
                  ? 'bg-green-100 text-green-700'
                  : trendPerWeek < -0.5
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {trendPerWeek > 0.5 ? (
                <TrendingUp className="w-4 h-4" />
              ) : trendPerWeek < -0.5 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <Minus className="w-4 h-4" />
              )}
              {trendPerWeek > 0 ? '+' : ''}
              {trendPerWeek.toFixed(1)}/週
            </div>
            {/* 期間変化 */}
            <div className="text-sm">
              <span className="text-gray-500">期間変化:</span>
              <span
                className={`ml-1 font-medium ${
                  stats.change > 0
                    ? 'text-green-600'
                    : stats.change < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stats.change > 0 ? '+' : ''}
                {stats.change}点
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 統計サマリー */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.latest}</div>
            <div className="text-xs text-blue-500">最新スコア</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.avg}</div>
            <div className="text-xs text-gray-500">平均</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.max}</div>
            <div className="text-xs text-green-500">最高</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.min}</div>
            <div className="text-xs text-red-500">最低</div>
          </div>
        </div>
      )}

      {/* チャート */}
      <div className="bg-white border rounded-lg p-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* 目標ライン */}
            {targetScore && (
              <ReferenceLine
                y={targetScore}
                stroke="#10B981"
                strokeDasharray="5 5"
                label={{
                  value: `目標: ${targetScore}`,
                  position: 'right',
                  fill: '#10B981',
                  fontSize: 11,
                }}
              />
            )}

            {/* スコアライン */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              name="スコア"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* データポイント数 */}
      <div className="text-xs text-gray-400 text-center">
        {data.length}件のデータポイント
        {data.length > 0 && (
          <>
            {' '}
            ({formatDateFull(data[0].date)} 〜{' '}
            {formatDateFull(data[data.length - 1].date)})
          </>
        )}
      </div>
    </div>
  )
}

/**
 * 複数URLのトレンド比較
 */
interface MultiUrlTrendData {
  date: string
  [url: string]: string | number
}

interface MultiTrendChartProps {
  data: MultiUrlTrendData[]
  urls: string[]
  title?: string
}

export function MultiTrendChart({
  data,
  urls,
  title = 'URL別スコア推移',
}: MultiTrendChartProps) {
  // URLから短い表示名を生成
  const getShortUrl = (url: string): string => {
    try {
      const parsed = new URL(url)
      const path = parsed.pathname
      if (path === '/') return 'トップ'
      const segments = path.split('/').filter(s => s)
      return '/' + segments.slice(-1).join('/')
    } catch {
      return url.slice(0, 15)
    }
  }

  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="bg-white border rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <Tooltip />
            <Legend />

            {urls.map((url, idx) => (
              <Line
                key={url}
                type="monotone"
                dataKey={url}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[idx % colors.length], strokeWidth: 2 }}
                name={getShortUrl(url)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TrendChart
