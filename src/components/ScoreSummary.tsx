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
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className={`px-4 py-3 rounded-lg border ${getColorClass(score)}`}>
      <div className="text-sm font-medium mb-1 flex items-center">
        {label}
        {tooltip && (
          <span className="ml-1">
            <button
              ref={buttonRef}
              type="button"
              className="w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-600 text-xs font-bold inline-flex items-center justify-center cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              ?
            </button>
            {showTooltip && createPortal(
              <div
                className="fixed z-[9999] w-56 p-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-xl"
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
      <div className="text-2xl font-bold">{score}</div>
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
