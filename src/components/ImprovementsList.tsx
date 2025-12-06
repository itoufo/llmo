import type { AnalyzeResult } from '../types'

interface Props {
  result: AnalyzeResult
}

export function ImprovementsList({ result }: Props) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        改善ポイント
      </h3>
      <ul className="space-y-3">
        {result.improvements.map((item, i) => (
          <li key={i} className="flex items-start text-gray-700">
            <span className="text-orange-500 font-bold mr-3 flex-shrink-0">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {result.details?.missingConcepts && result.details.missingConcepts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-orange-200">
          <h4 className="text-sm font-semibold text-orange-900 mb-2">追加すべき概念</h4>
          <div className="flex flex-wrap gap-2">
            {result.details.missingConcepts.map((concept, i) => (
              <span key={i} className="bg-white text-orange-700 text-xs px-3 py-1 rounded-full border border-orange-300">
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.details?.questions && result.details.questions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-orange-200">
          <h4 className="text-sm font-semibold text-orange-900 mb-2">このページが答えられる質問</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {result.details.questions.slice(0, 5).map((question, i) => (
              <li key={i} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
