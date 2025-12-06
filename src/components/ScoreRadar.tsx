import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { AnalyzeResult } from '../types'

interface Props {
  result: AnalyzeResult
}

export function ScoreRadar({ result }: Props) {
  const data = [
    { subject: 'AI引用', value: result.scores.aiCitation, fullMark: 100 },
    { subject: '質問適合', value: result.scores.questionFit, fullMark: 100 },
    { subject: '概念カバレッジ', value: result.scores.coverage, fullMark: 100 },
    { subject: '構造', value: result.scores.structure, fullMark: 100 },
    { subject: 'E-E-A-T', value: result.scores.eeat, fullMark: 100 }
  ]

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <Radar
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
