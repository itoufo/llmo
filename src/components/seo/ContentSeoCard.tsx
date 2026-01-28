import { useState } from 'react'

interface ContentSeoProps {
  contentSeo: {
    score: number
    items: {
      wordCount: { value: number; rating: 'thin' | 'adequate' | 'optimal' | 'comprehensive' }
      keywordDensity: { primary?: string; density: number; natural: boolean }
      readability: { score: number; level: string }
      uniqueContent: { ratio: number; duplicate?: boolean }
      freshness: { lastModified?: string; age?: number }
      multimedia: { videos: number; images: number; infographics: number }
      lists: { ordered: number; unordered: number }
      tables: { count: number; withCaption: number }
    }
    scoreBreakdown?: {
      baseScore: number
      deductions: Array<{ reason: string; penalty: number; current?: number }>
      calculations: Array<{ reason: string; penalty?: number; data?: any }>
      llmScore?: number
      llmReasoning?: string
      llmDetails?: {
        wordCountScore: number
        mediaScore: number
        structureScore: number
        densityScore: number
      }
      note?: string
    }
  }
}

export function ContentSeoCard({ contentSeo }: ContentSeoProps) {
  const [expanded, setExpanded] = useState(false)
  const scoreBreakdown = contentSeo.scoreBreakdown as any
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📝</span>
        コンテンツSEO（{contentSeo.score}点）
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {expanded ? '詳細を閉じる' : 'スコア詳細'}
        </button>
      </h4>
      
      {/* スコア計算詳細 */}
      {expanded && scoreBreakdown && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
            <span className="mr-2">🧮</span>
            スコア計算の詳細
          </h5>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span>基本スコア</span>
              <span className="font-bold text-blue-700">{scoreBreakdown.baseScore}点</span>
            </div>
            
            {/* 加点・減点項目 */}
            {scoreBreakdown.calculations?.map((calc: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded text-green-800">
                <span>✅ {calc.reason}</span>
                <span className="font-medium">減点なし</span>
              </div>
            ))}
            
            {/* 減点項目 */}
            {scoreBreakdown.deductions?.map((deduction: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded text-red-800">
                <span>❌ {deduction.reason}</span>
                <span className="font-medium">{deduction.penalty}点</span>
              </div>
            ))}
            
            {/* LLMによるスコア決定と点数内訳 */}
            {scoreBreakdown.llmScore && (
              <div className="p-3 bg-purple-50 rounded border border-purple-200">
                <div className="flex items-center justify-between text-purple-800 mb-2">
                  <span className="font-semibold">🤖 LLM点数決定</span>
                  <span className="font-bold text-lg">
                    {scoreBreakdown.llmScore}点
                  </span>
                </div>
                
                {/* 点数内訳の詳細表示 */}
                <div className="bg-white/70 p-3 rounded space-y-2 text-xs">
                  {scoreBreakdown.llmDetails && (
                    <>
                      <div className="font-semibold text-purple-900 mb-2">点数内訳:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between p-1 bg-purple-50 rounded">
                          <span>文字数（40点満点）</span>
                          <span className="font-bold">
                            {scoreBreakdown.llmDetails.wordCountScore}点
                          </span>
                        </div>
                        <div className="flex justify-between p-1 bg-purple-50 rounded">
                          <span>画像・メディア（20点満点）</span>
                          <span className="font-bold">
                            {scoreBreakdown.llmDetails.mediaScore}点
                          </span>
                        </div>
                        <div className="flex justify-between p-1 bg-purple-50 rounded">
                          <span>構造化（20点満点）</span>
                          <span className="font-bold">
                            {scoreBreakdown.llmDetails.structureScore}点
                          </span>
                        </div>
                        <div className="flex justify-between p-1 bg-purple-50 rounded">
                          <span>情報密度（20点満点）</span>
                          <span className="font-bold">
                            {scoreBreakdown.llmDetails.densityScore}点
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {scoreBreakdown.llmReasoning && (
                    <div className={scoreBreakdown.llmDetails ? "mt-3 pt-2 border-t border-purple-200" : ""}>
                      <div className="font-semibold mb-1">計算根拠:</div>
                      <div className="whitespace-pre-wrap text-purple-700">
                        {scoreBreakdown.llmReasoning}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-gray-100 rounded font-bold border-t-2 border-gray-300">
              <span>最終スコア</span>
              <span className="text-xl text-gray-900">{contentSeo.score}点</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">コンテンツ量</span>
            <span className={contentSeo.items.wordCount.rating === 'comprehensive' ? 'text-green-600' : contentSeo.items.wordCount.rating === 'optimal' ? 'text-green-600' : contentSeo.items.wordCount.rating === 'adequate' ? 'text-yellow-600' : 'text-red-600'}>
              {contentSeo.items.wordCount.value}語 ({contentSeo.items.wordCount.rating === 'thin' ? '薄い' : contentSeo.items.wordCount.rating === 'adequate' ? '適切' : contentSeo.items.wordCount.rating === 'optimal' ? '最適' : '包括的'})
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">画像</span>
            <span className={contentSeo.items.multimedia.images > 0 ? 'text-green-600' : 'text-red-600'}>
              {contentSeo.items.multimedia.images}個
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">リスト構造</span>
            <span className={contentSeo.items.lists.ordered + contentSeo.items.lists.unordered > 0 ? 'text-green-600' : 'text-red-600'}>
              順序: {contentSeo.items.lists.ordered}個, 箇条書き: {contentSeo.items.lists.unordered}個
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">テーブル</span>
            <span className={contentSeo.items.tables.count > 0 ? 'text-green-600' : 'text-gray-600'}>
              {contentSeo.items.tables.count}個 (キャプション付き: {contentSeo.items.tables.withCaption}個)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}