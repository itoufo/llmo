import { useState, useRef } from 'react'
import { UrlForm } from './components/UrlForm'
import { ScoreRadar } from './components/ScoreRadar'
import { ScoreSummary } from './components/ScoreSummary'
import { QuestionsList } from './components/QuestionsList'
import { ImprovementsList } from './components/ImprovementsList'
import { SeoSummary } from './components/SeoSummary'
import { Tooltip } from './components/Tooltip'
import type { AnalyzeResult } from './types'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function App() {
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [exporting, setExporting] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const exportAsPDF = async () => {
    if (!result || !resultsRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      let heightLeft = imgHeight * ratio
      let position = 0

      // First page
      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio)
      heightLeft -= pdfHeight

      // Additional pages if needed
      while (heightLeft > 0) {
        position -= pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio)
        heightLeft -= pdfHeight
      }

      pdf.save(`llmo-seo-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDFエクスポートに失敗しました')
    } finally {
      setExporting(false)
    }
  }

  const exportAsJSON = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `llmo-seo-report-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsCSV = () => {
    if (!result) return
    const rows = [
      ['診断URL', result.url],
      ['診断日時', new Date().toLocaleString('ja-JP')],
      [''],
      ['=== スコア ==='],
      ['総合スコア', result.scores.overall],
      ['LLMOスコア', result.scores.llmoOverall || ''],
      ['SEOスコア', result.scores.seoOverall || ''],
      ['AI引用', result.scores.aiCitation],
      ['質問適合', result.scores.questionFit],
      ['概念カバレッジ', result.scores.coverage],
      ['構造', result.scores.structure],
      ['E-E-A-T', result.scores.eeat],
      [''],
      ['=== 改善ポイント ==='],
      ['優先度', 'カテゴリ', 'タイプ', '問題', 'アクション'],
      ...result.improvements.map(i => [i.priority, i.category, i.type || '', i.issue, i.action]),
      [''],
      ['=== 回答可能な質問 ==='],
      ...(result.questions?.answerable || []).map(q => [q]),
    ]
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `llmo-seo-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            LLMO + SEO Site Doctor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            URLを入力するだけで、AIが引用したくなる度 + SEO最適化度をスコア化
          </p>
          <p className="text-sm text-gray-500 mt-2">
            LLM（ChatGPT / Gemini / Claude等）と検索エンジン両方に最適化されたコンテンツか診断します
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <UrlForm onResult={setResult} />
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="space-y-8 animate-fadeIn">
            {/* Overall Score */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="inline-block">
                  <div className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {result.scores.overall}
                  </div>
                  <div className="text-gray-600 font-semibold mt-2">総合スコア</div>

                  {/* LLMO + SEO スコア表示 */}
                  {result.scores.llmoOverall !== undefined && result.scores.seoOverall !== undefined && (
                    <div className="flex justify-center gap-8 mt-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{result.scores.llmoOverall}</div>
                        <div className="text-sm text-gray-500">LLMO</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{result.scores.seoOverall}</div>
                        <div className="text-sm text-gray-500">SEO</div>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500 mt-4">
                    診断URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{result.url}</a>
                  </div>
                  {result.details?.aiCitationComment && (
                    <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-w-xl mx-auto">
                      {result.details.aiCitationComment}
                    </div>
                  )}
                </div>
              </div>

              {/* LLMO詳細 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
                  <span className="mr-2">🤖</span>
                  LLMO診断
                  <Tooltip text="LLMO（LLM Optimization）= AIチャットボット（ChatGPT、Gemini、Claude等）があなたのコンテンツを引用・参照しやすくするための最適化指標です" />
                </h2>
                <ScoreSummary result={result} />
              </div>
              <div className="pt-6 border-t border-gray-200 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">スコア分布</h2>
                <ScoreRadar result={result} />
              </div>

              {/* SEO詳細 */}
              {result.seo && result.scores.seoOverall !== undefined && (
                <div className="pt-6 border-t border-gray-200">
                  <SeoSummary seo={result.seo} seoOverall={result.scores.seoOverall} />
                </div>
              )}
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
            <div className="flex flex-col items-center gap-4">
              {/* Export buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={exportAsPDF}
                  disabled={exporting}
                  className="inline-flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      PDF作成中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PDFでエクスポート
                    </>
                  )}
                </button>
                <button
                  onClick={exportAsJSON}
                  className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  JSONでエクスポート
                </button>
                <button
                  onClick={exportAsCSV}
                  className="inline-flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-lg transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSVでエクスポート
                </button>
              </div>
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
          <p>Powered by OpenAI GPT | Built with Vite, React, Supabase Edge Functions</p>
        </div>
      </div>
    </div>
  )
}

export default App
