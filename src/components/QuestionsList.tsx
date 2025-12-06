import type { AnalyzeResult } from '../types'

interface Props {
  result: AnalyzeResult
}

export function QuestionsList({ result }: Props) {
  const { questions } = result

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span className="text-2xl">❓</span>
        質問対応力
      </h3>

      {/* 現在答えられる質問 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
          <span className="text-green-500">✓</span>
          現在答えられる質問（{questions.answerable?.length || 0}件）
        </h4>
        <ul className="space-y-2">
          {questions.answerable?.map((q, i) => (
            <li key={i} className="flex items-start text-sm text-gray-700">
              <span className="text-green-500 mr-2 mt-0.5">●</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 部分的に答えられる質問 */}
      {questions.partial && questions.partial.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <span className="text-yellow-500">△</span>
            部分的に答えられる質問（{questions.partial.length}件）
          </h4>
          <ul className="space-y-3">
            {questions.partial.map((item, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-start text-gray-700">
                  <span className="text-yellow-500 mr-2 mt-0.5">●</span>
                  <span className="font-medium">{item.question}</span>
                </div>
                <div className="ml-5 mt-1 text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1">
                  不足: {item.missing}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 改善後に答えられる質問 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
          <span className="text-blue-500">★</span>
          改善後に答えられるようになる質問（{questions.afterImprovement?.length || 0}件）
        </h4>
        <p className="text-xs text-blue-600 mb-3">
          提案された改善を実施すると、以下の質問にも対応できるようになります
        </p>
        <ul className="space-y-2">
          {questions.afterImprovement?.map((q, i) => (
            <li key={i} className="flex items-start text-sm text-gray-700">
              <span className="text-blue-500 mr-2 mt-0.5">○</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* サマリー */}
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <div className="flex justify-center gap-8 text-sm">
          <div>
            <div className="text-2xl font-bold text-green-600">{questions.answerable?.length || 0}</div>
            <div className="text-gray-600">回答可能</div>
          </div>
          <div className="border-l border-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{questions.partial?.length || 0}</div>
            <div className="text-gray-600">部分対応</div>
          </div>
          <div className="border-l border-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-blue-600">+{questions.afterImprovement?.length || 0}</div>
            <div className="text-gray-600">改善後</div>
          </div>
        </div>
      </div>
    </div>
  )
}
