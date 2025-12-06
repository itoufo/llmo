import type { AnalyzeResult } from '../types'

interface Props {
  result: AnalyzeResult
}

interface ScoreItemProps {
  label: string
  score: number
}

function ScoreItem({ label, score }: ScoreItemProps) {
  const getColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className={`px-4 py-3 rounded-lg border ${getColorClass(score)}`}>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold">{score}</div>
    </div>
  )
}

export function ScoreSummary({ result }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <ScoreItem label="AI引用" score={result.scores.aiCitation} />
      <ScoreItem label="質問適合" score={result.scores.questionFit} />
      <ScoreItem label="概念カバレッジ" score={result.scores.coverage} />
      <ScoreItem label="構造" score={result.scores.structure} />
      <ScoreItem label="E-E-A-T" score={result.scores.eeat} />
      <div className="col-span-2 md:col-span-1">
        <ScoreItem label="総合スコア" score={result.scores.overall} />
      </div>
    </div>
  )
}
