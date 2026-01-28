import { useState } from 'react'

interface TechnicalSeoProps {
  technicalSeo: {
    score: number
    items: {
      canonicalUrl: { exists: boolean; correct: boolean; url?: string }
      robots: { exists: boolean; content?: string; issues?: string[] }
      sitemap: { exists: boolean; referenced: boolean }
      ssl: { enabled: boolean; mixed: boolean }
      mobileViewport: { exists: boolean; content?: string }
      lang: { exists: boolean; value?: string }
      charset: { exists: boolean; value?: string }
      openGraph: { exists: boolean; complete: boolean; missing?: string[] }
      twitterCard: { exists: boolean; type?: string }
      jsonLd: { exists: boolean; valid: boolean; type?: string }
    }
  }
  scoreReasoning?: any
}

export function TechnicalSeoCard({ technicalSeo, scoreReasoning }: TechnicalSeoProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🔧</span>
        技術的SEO（{technicalSeo.score}点）
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {expanded ? '詳細を閉じる' : 'スコア詳細'}
        </button>
      </h4>
      
      {/* スコア根拠 */}
      {expanded && scoreReasoning?.technical && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-1">🤖 LLMスコア算出根拠:</div>
            <div className="whitespace-pre-wrap">{scoreReasoning.technical}</div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Canonical URL</span>
            <span className={technicalSeo.items.canonicalUrl.exists ? 'text-green-600' : 'text-red-600'}>
              {technicalSeo.items.canonicalUrl.exists ? '✅ 設定済み' : '❌ 未設定'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">JSON-LD構造化データ</span>
            <span className={technicalSeo.items.jsonLd.exists ? 'text-green-600' : 'text-red-600'}>
              {technicalSeo.items.jsonLd.exists ? '✅ 設定済み' : '❌ 未設定'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Open Graph</span>
            <span className={technicalSeo.items.openGraph.complete ? 'text-green-600' : technicalSeo.items.openGraph.exists ? 'text-yellow-600' : 'text-red-600'}>
              {technicalSeo.items.openGraph.complete ? '✅ 完全' : technicalSeo.items.openGraph.exists ? '⚠️ 不完全' : '❌ 未設定'}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Twitter Card</span>
            <span className={technicalSeo.items.twitterCard.exists ? 'text-green-600' : 'text-red-600'}>
              {technicalSeo.items.twitterCard.exists ? '✅ 設定済み' : '❌ 未設定'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">SSL設定</span>
            <span className={technicalSeo.items.ssl.enabled ? 'text-green-600' : 'text-red-600'}>
              {technicalSeo.items.ssl.enabled ? '✅ HTTPS' : '❌ HTTP'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Viewport設定</span>
            <span className={technicalSeo.items.mobileViewport.exists ? 'text-green-600' : 'text-red-600'}>
              {technicalSeo.items.mobileViewport.exists ? '✅ 設定済み' : '❌ 未設定'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}