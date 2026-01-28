import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { AnalyzeResult } from '../types'

interface Props {
  result: AnalyzeResult
}

interface ScoreItemProps {
  label: string
  score: number
  tooltip?: string
}

function ScoreItem({ label, score, tooltip }: ScoreItemProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: rect.left - 100
      })
    }
  }, [showTooltip])

  const getColorClass = (score: number) => {
    if (score >= 80) return 'score-excellent'
    if (score >= 60) return 'score-good'
    if (score >= 40) return 'score-fair'
    return 'score-poor'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-green-500'
    if (score >= 60) return 'from-blue-400 to-indigo-500'
    if (score >= 40) return 'from-amber-400 to-yellow-500'
    return 'from-red-400 to-rose-500'
  }

  return (
    <div className={`px-5 py-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${getColorClass(score)}`}>
      <div className="text-sm font-semibold mb-2 flex items-center">
        {label}
        {tooltip && (
          <span className="ml-1.5">
            <button
              ref={buttonRef}
              type="button"
              className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-xs font-bold inline-flex items-center justify-center cursor-help transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              ?
            </button>
            {showTooltip && createPortal(
              <div
                className="fixed z-[9999] w-64 p-3 text-xs text-gray-700 bg-white border border-gray-100 rounded-xl shadow-xl"
                style={{ top: position.top, left: Math.max(10, position.left) }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {tooltip}
              </div>,
              document.body
            )}
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold mb-2">{score}</div>
      <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

const tooltips = {
  aiCitation: 'AIがこのコンテンツを回答に引用・参照したくなる度合い。信頼性・具体性・独自性などを評価します。',
  questionFit: 'ユーザーがAIに質問しそうな内容に、このコンテンツがどれだけ適切に答えられるかの指標。',
  coverage: 'このトピックに関連する重要な概念・キーワードをどれだけ網羅しているかの指標。',
  structure: 'コンテンツの構造化の度合い。見出し、リスト、表などを使って情報が整理されているか。',
  eeat: 'E-E-A-T = 経験(Experience)・専門性(Expertise)・権威性(Authoritativeness)・信頼性(Trustworthiness)。Googleが品質評価で重視する指標。'
}

export function ScoreSummary({ result }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <ScoreItem label="AI引用" score={result.scores.aiCitation} tooltip={tooltips.aiCitation} />
      <ScoreItem label="質問適合" score={result.scores.questionFit} tooltip={tooltips.questionFit} />
      <ScoreItem label="概念カバレッジ" score={result.scores.coverage} tooltip={tooltips.coverage} />
      <ScoreItem label="構造" score={result.scores.structure} tooltip={tooltips.structure} />
      <ScoreItem label="E-E-A-T" score={result.scores.eeat} tooltip={tooltips.eeat} />
      <div className="col-span-2 md:col-span-1">
        <ScoreItem label="総合スコア" score={result.scores.overall} />
      </div>
    </div>
  )
}
