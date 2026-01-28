import type { AnalyzeResult } from '../types'

interface Props {
  result: AnalyzeResult
}

export function QuestionsList({ result }: Props) {
  const { questions } = result

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        質問対応力
      </h3>

      {/* 現在答えられる質問 */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-5">
        <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          現在答えられる質問（{questions.answerable?.length || 0}件）
        </h4>
        <ul className="space-y-2">
          {questions.answerable?.map((q, i) => (
            <li key={i} className="flex items-start text-sm text-gray-700 bg-white/60 rounded-lg p-3">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold flex-shrink-0">{i + 1}</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 部分的に答えられる質問 */}
      {questions.partial && questions.partial.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5">
          <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            部分的に答えられる質問（{questions.partial.length}件）
          </h4>
          <ul className="space-y-3">
            {questions.partial.map((item, i) => (
              <li key={i} className="text-sm bg-white/60 rounded-lg p-3">
                <div className="flex items-start text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <span className="font-medium">{item.question}</span>
                </div>
                <div className="ml-8 mt-2 text-xs text-amber-700 bg-amber-100/80 rounded-lg px-3 py-2 border border-amber-200">
                  不足: {item.missing}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 改善後に答えられる質問 */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-5">
        <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          改善後に答えられるようになる質問（{questions.afterImprovement?.length || 0}件）
        </h4>
        <p className="text-xs text-indigo-600 mb-4 bg-indigo-100/60 rounded-lg px-3 py-2">
          提案された改善を実施すると、以下の質問にも対応できるようになります
        </p>
        <ul className="space-y-2">
          {questions.afterImprovement?.map((q, i) => (
            <li key={i} className="flex items-start text-sm text-gray-700 bg-white/60 rounded-lg p-3">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold flex-shrink-0">+</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* サマリー */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 text-center border border-gray-200">
        <div className="flex justify-center gap-6 sm:gap-10 text-sm">
          <div className="px-4 py-3 bg-white rounded-xl shadow-sm">
            <div className="text-3xl font-extrabold text-emerald-600">{questions.answerable?.length || 0}</div>
            <div className="text-gray-500 font-medium mt-1">回答可能</div>
          </div>
          <div className="px-4 py-3 bg-white rounded-xl shadow-sm">
            <div className="text-3xl font-extrabold text-amber-600">{questions.partial?.length || 0}</div>
            <div className="text-gray-500 font-medium mt-1">部分対応</div>
          </div>
          <div className="px-4 py-3 bg-white rounded-xl shadow-sm">
            <div className="text-3xl font-extrabold text-indigo-600">+{questions.afterImprovement?.length || 0}</div>
            <div className="text-gray-500 font-medium mt-1">改善後</div>
          </div>
        </div>
      </div>
    </div>
  )
}
