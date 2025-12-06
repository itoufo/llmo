import { useState } from 'react'
import { UrlForm } from './components/UrlForm'
import { ScoreRadar } from './components/ScoreRadar'
import { ScoreSummary } from './components/ScoreSummary'
import { QuestionsList } from './components/QuestionsList'
import { ImprovementsList } from './components/ImprovementsList'
import type { AnalyzeResult } from './types'

function App() {
  const [result, setResult] = useState<AnalyzeResult | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            LLMO Site Doctor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            URLを入力するだけで、AIが引用したくなる度をスコア化
          </p>
          <p className="text-sm text-gray-500 mt-2">
            LLM（ChatGPT / Gemini / Claude等）に最適化されたコンテンツか診断します
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <UrlForm onResult={setResult} />
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-fadeIn">
            {/* Overall Score */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="inline-block">
                  <div className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {result.scores.overall}
                  </div>
                  <div className="text-gray-600 font-semibold mt-2">総合スコア</div>
                  <div className="text-sm text-gray-500 mt-1">
                    診断URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{result.url}</a>
                  </div>
                  {result.details?.aiCitationComment && (
                    <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-w-xl mx-auto">
                      {result.details.aiCitationComment}
                    </div>
                  )}
                </div>
              </div>

              {/* Score Summary Grid */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">詳細スコア</h2>
                <ScoreSummary result={result} />
              </div>

              {/* Radar Chart */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">スコア分布</h2>
                <ScoreRadar result={result} />
              </div>
            </div>

            {/* Questions */}
            {result.questions && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <QuestionsList result={result} />
              </div>
            )}

            {/* Improvements */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <ImprovementsList result={result} />
            </div>

            {/* Footer Actions */}
            <div className="text-center">
              <button
                onClick={() => setResult(null)}
                className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                別のURLを診断する
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>Powered by OpenAI GPT-4 | Built with Vite, React, Netlify & Supabase</p>
        </div>
      </div>
    </div>
  )
}

export default App
