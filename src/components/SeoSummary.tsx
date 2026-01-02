import { useState } from 'react'
import type { SEOResult } from '../types'
import { Tooltip } from './Tooltip'

interface Props {
  seo: SEOResult
  seoOverall: number
}

// 拡張されたSEOResult型（htmlFix付き）
interface ExtendedSEOResult extends SEOResult {
  title: SEOResult['title'] & { htmlFix?: string }
  meta: SEOResult['meta'] & { htmlFix?: string }
  headings: SEOResult['headings'] & { htmlFix?: string; structure?: string[] }
  images: SEOResult['images'] & { htmlFix?: string; missingAltImages?: string[] }
  links: SEOResult['links'] & { htmlFix?: string }
  mobile: SEOResult['mobile'] & { htmlFix?: string }
  canonical: SEOResult['canonical'] & { htmlFix?: string }
  structured: SEOResult['structured'] & { htmlFix?: string }
  ogp?: { hasOgp: boolean; issues: string[]; htmlFix?: string }
  headHtml?: string
  advancedSeo?: {
    technicalSeo: { score: number; items: any }
    performanceSeo: { score: number; items: any }
    contentSeo: { score: number; items: any }
    userExperience: { score: number; items: any }
  }
}

export function SeoSummary({ seo, seoOverall }: Props) {
  const [showFullHead, setShowFullHead] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const extSeo = seo as ExtendedSEOResult
  
  // デバッグ: Advanced SEOデータの確認
  console.log('SeoSummary - Advanced SEO data:', extSeo.advancedSeo)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
    if (score >= 60) return 'text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
    return 'text-rose-700 bg-gradient-to-r from-rose-50 to-red-50 border-rose-200'
  }

  const toggleExpand = (label: string) => {
    const newSet = new Set(expandedItems)
    if (newSet.has(label)) {
      newSet.delete(label)
    } else {
      newSet.add(label)
    }
    setExpandedItems(newSet)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('コードをコピーしました！')
  }

  const items = [
    { label: 'タイトル', score: extSeo.title.score, issues: extSeo.title.issues, suggestions: extSeo.title.suggestions, htmlFix: extSeo.title.htmlFix },
    { label: 'Meta Description', score: extSeo.meta.score, issues: extSeo.meta.issues, suggestions: extSeo.meta.suggestions, htmlFix: extSeo.meta.htmlFix },
    { label: '見出し構造', score: extSeo.headings.score, issues: extSeo.headings.issues, suggestions: extSeo.headings.suggestions, htmlFix: extSeo.headings.htmlFix },
    { label: '画像', score: extSeo.images.score, issues: extSeo.images.issues, suggestions: extSeo.images.suggestions, htmlFix: extSeo.images.htmlFix },
    { label: 'リンク', score: extSeo.links.score, issues: extSeo.links.issues, suggestions: extSeo.links.suggestions, htmlFix: extSeo.links.htmlFix },
    { label: 'モバイル', score: extSeo.mobile.score, issues: extSeo.mobile.issues, suggestions: extSeo.mobile.suggestions, htmlFix: extSeo.mobile.htmlFix },
    { label: 'パフォーマンス', score: extSeo.performance.score, issues: extSeo.performance.issues, suggestions: extSeo.performance.suggestions },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gradient-blue flex items-center">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mr-3 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          SEO診断
          <Tooltip text="SEO（Search Engine Optimization）= Google等の検索エンジンで上位表示されるための最適化指標です。タイトル、メタ情報、見出し構造、画像最適化などを評価します。" />
        </h2>
        <div className={`px-5 py-2.5 rounded-xl font-bold border ${getScoreColor(seoOverall)}`}>
          {seoOverall}点
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-sm text-gray-500 font-medium">H1</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{extSeo.headings.h1Count}</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-sm text-gray-500 font-medium">H2</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{extSeo.headings.h2Count}</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-sm text-gray-500 font-medium">画像</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{extSeo.images.withAlt}/{extSeo.images.total}</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-sm text-gray-500 font-medium">内部リンク</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{extSeo.links.internal}</div>
        </div>
      </div>

      {/* 推奨<head>タグ */}
      {extSeo.headHtml && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-green-800 flex items-center">
              <span className="mr-2">📋</span>
              推奨 &lt;head&gt; タグ（コピー可）
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFullHead(!showFullHead)}
                className="text-sm px-3 py-1 bg-white rounded border hover:bg-gray-50"
              >
                {showFullHead ? '閉じる' : '展開する'}
              </button>
              <button
                onClick={() => copyToClipboard(extSeo.headHtml || '')}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                コピー
              </button>
            </div>
          </div>
          {showFullHead && (
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
              {extSeo.headHtml}
            </pre>
          )}
        </div>
      )}

      {/* Advanced SEO 詳細診断 */}
      {extSeo.advancedSeo && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="text-xl font-bold text-indigo-800 mb-6 flex items-center">
              <span className="mr-3">🤖</span>
              統合SEO診断結果（LLM × Advanced SEO）
            </h3>
            
            {/* スコア算出方法の説明 */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-indigo-100">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🤖</span>
                AIによる統合評価システム
              </h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div>🔹 <strong>基本SEO</strong>：30% の重み（タイトル、メタディスクリプション、見出し、画像など）</div>
                <div>🔹 <strong>詳細SEO</strong>：70% の重み（技術的SEO、パフォーマンス、コンテンツ、UX）</div>
                <div>🔹 <strong>LLM評価</strong>：コンテンツの質、情報密度、独自性を動的に評価</div>
                <div className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded mt-3">
                  💡 固定基準ではなく、コンテンツの特性に応じてAIが最適な評価基準を算出
                </div>
              </div>
            </div>
            
            {/* サマリースコア */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-indigo-100 text-center">
                <div className="text-xs text-gray-600 mb-2 font-medium">技術的SEO</div>
                <div className={`text-3xl font-bold ${getScoreColor(extSeo.advancedSeo.technicalSeo.score).split(' ')[0]}`}>
                  {extSeo.advancedSeo.technicalSeo.score}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-100 text-center">
                <div className="text-xs text-gray-600 mb-2 font-medium">パフォーマンス</div>
                <div className={`text-3xl font-bold ${getScoreColor(extSeo.advancedSeo.performanceSeo.score).split(' ')[0]}`}>
                  {extSeo.advancedSeo.performanceSeo.score}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-100 text-center">
                <div className="text-xs text-gray-600 mb-2 font-medium">コンテンツSEO</div>
                <div className={`text-3xl font-bold ${getScoreColor(extSeo.advancedSeo.contentSeo.score).split(' ')[0]}`}>
                  {extSeo.advancedSeo.contentSeo.score}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-100 text-center">
                <div className="text-xs text-gray-600 mb-2 font-medium">ユーザー体験</div>
                <div className={`text-3xl font-bold ${getScoreColor(extSeo.advancedSeo.userExperience.score).split(' ')[0]}`}>
                  {extSeo.advancedSeo.userExperience.score}
                </div>
              </div>
            </div>
          </div>

          {/* 技術的SEO詳細 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🔧</span>
              技術的SEO（{extSeo.advancedSeo.technicalSeo.score}点）
              <button
                onClick={() => toggleExpand('technicalSeoBreakdown')}
                className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {expandedItems.has('technicalSeoBreakdown') ? '詳細を閉じる' : 'スコア詳細'}
              </button>
            </h4>
            
            {/* スコア根拠 */}
            {expandedItems.has('technicalSeoBreakdown') && (extSeo.advancedSeo as any).scoreReasoning?.technical && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-900">
                  <div className="font-semibold mb-1">🤖 LLMスコア算出根拠:</div>
                  <div className="whitespace-pre-wrap">{(extSeo.advancedSeo as any).scoreReasoning.technical}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Canonical URL</span>
                  <span className={extSeo.advancedSeo.technicalSeo.items.canonicalUrl.exists ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.technicalSeo.items.canonicalUrl.exists ? '✅ 設定済み' : '❌ 未設定'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">JSON-LD構造化データ</span>
                  <span className={extSeo.advancedSeo.technicalSeo.items.jsonLd.exists ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.technicalSeo.items.jsonLd.exists ? '✅ 設定済み' : '❌ 未設定'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Open Graph</span>
                  <span className={extSeo.advancedSeo.technicalSeo.items.openGraph.complete ? 'text-green-600' : extSeo.advancedSeo.technicalSeo.items.openGraph.exists ? 'text-yellow-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.technicalSeo.items.openGraph.complete ? '✅ 完全' : extSeo.advancedSeo.technicalSeo.items.openGraph.exists ? '⚠️ 不完全' : '❌ 未設定'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Twitter Card</span>
                  <span className={extSeo.advancedSeo.technicalSeo.items.twitterCard.exists ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.technicalSeo.items.twitterCard.exists ? '✅ 設定済み' : '❌ 未設定'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">SSL設定</span>
                  <span className={extSeo.advancedSeo.technicalSeo.items.ssl.enabled ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.technicalSeo.items.ssl.enabled ? '✅ HTTPS' : '❌ HTTP'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Viewport設定</span>
                  <span className={extSeo.advancedSeo.technicalSeo.items.mobileViewport.exists ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.technicalSeo.items.mobileViewport.exists ? '✅ 設定済み' : '❌ 未設定'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* パフォーマンスSEO詳細 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              パフォーマンスSEO（{extSeo.advancedSeo.performanceSeo.score}点）
              <button
                onClick={() => toggleExpand('performanceSeoBreakdown')}
                className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {expandedItems.has('performanceSeoBreakdown') ? '詳細を閉じる' : 'スコア詳細'}
              </button>
            </h4>
            
            {/* スコア根拠 */}
            {expandedItems.has('performanceSeoBreakdown') && (extSeo.advancedSeo as any).scoreReasoning?.performance && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-900">
                  <div className="font-semibold mb-1">🤖 LLMスコア算出根拠:</div>
                  <div className="whitespace-pre-wrap">{(extSeo.advancedSeo as any).scoreReasoning.performance}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">HTMLサイズ</span>
                  <span className={extSeo.advancedSeo.performanceSeo.items.htmlSize.rating === 'optimal' ? 'text-green-600' : extSeo.advancedSeo.performanceSeo.items.htmlSize.rating === 'heavy' ? 'text-yellow-600' : 'text-red-600'}>
                    {Math.round(extSeo.advancedSeo.performanceSeo.items.htmlSize.value / 1024)}KB ({extSeo.advancedSeo.performanceSeo.items.htmlSize.rating === 'optimal' ? '最適' : extSeo.advancedSeo.performanceSeo.items.htmlSize.rating === 'heavy' ? '重い' : '過重'})
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">インラインCSS</span>
                  <span className={extSeo.advancedSeo.performanceSeo.items.inlineCSS.excessive ? 'text-red-600' : 'text-green-600'}>
                    {extSeo.advancedSeo.performanceSeo.items.inlineCSS.count}個 ({extSeo.advancedSeo.performanceSeo.items.inlineCSS.excessive ? '多い' : 'OK'})
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">インラインJS</span>
                  <span className={extSeo.advancedSeo.performanceSeo.items.inlineJS.excessive ? 'text-red-600' : 'text-green-600'}>
                    {extSeo.advancedSeo.performanceSeo.items.inlineJS.count}個 ({extSeo.advancedSeo.performanceSeo.items.inlineJS.excessive ? '多い' : 'OK'})
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">外部リンク</span>
                  <span className="text-gray-700">
                    {extSeo.advancedSeo.performanceSeo.items.externalLinks.count}個 (nofollow: {extSeo.advancedSeo.performanceSeo.items.externalLinks.nofollow}個)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* コンテンツSEO詳細 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📝</span>
              コンテンツSEO（{extSeo.advancedSeo.contentSeo.score}点）
              <button
                onClick={() => toggleExpand('contentSeoBreakdown')}
                className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {expandedItems.has('contentSeoBreakdown') ? '詳細を閉じる' : 'スコア詳細'}
              </button>
            </h4>
            
            {/* スコア計算詳細 */}
            {expandedItems.has('contentSeoBreakdown') && (extSeo.advancedSeo.contentSeo as any).scoreBreakdown && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">🧮</span>
                  スコア計算の詳細
                </h5>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <span>基本スコア</span>
                    <span className="font-bold text-blue-700">{(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.baseScore}点</span>
                  </div>
                  
                  {/* 加点・減点項目 */}
                  {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.calculations?.map((calc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded text-green-800">
                      <span>✅ {calc.reason}</span>
                      <span className="font-medium">減点なし</span>
                    </div>
                  ))}
                  
                  {/* 減点項目 */}
                  {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.deductions?.map((deduction: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded text-red-800">
                      <span>❌ {deduction.reason}</span>
                      <span className="font-medium">{deduction.penalty}点</span>
                    </div>
                  ))}
                  
                  {/* LLMによるスコア決定と点数内訳 */}
                  {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmScore && (
                    <div className="p-3 bg-purple-50 rounded border border-purple-200">
                      <div className="flex items-center justify-between text-purple-800 mb-2">
                        <span className="font-semibold">🤖 LLM点数決定</span>
                        <span className="font-bold text-lg">
                          {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmScore}点
                        </span>
                      </div>
                      
                      {/* 点数内訳の詳細表示 */}
                      <div className="bg-white/70 p-3 rounded space-y-2 text-xs">
                        <div className="font-semibold text-purple-900 mb-2">点数内訳:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between p-1 bg-purple-50 rounded">
                            <span>文字数（40点満点）</span>
                            <span className="font-bold">
                              {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmDetails?.wordCountScore || '計算中'}点
                            </span>
                          </div>
                          <div className="flex justify-between p-1 bg-purple-50 rounded">
                            <span>画像・メディア（20点満点）</span>
                            <span className="font-bold">
                              {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmDetails?.mediaScore || '計算中'}点
                            </span>
                          </div>
                          <div className="flex justify-between p-1 bg-purple-50 rounded">
                            <span>構造化（20点満点）</span>
                            <span className="font-bold">
                              {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmDetails?.structureScore || '計算中'}点
                            </span>
                          </div>
                          <div className="flex justify-between p-1 bg-purple-50 rounded">
                            <span>情報密度（20点満点）</span>
                            <span className="font-bold">
                              {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmDetails?.densityScore || '計算中'}点
                            </span>
                          </div>
                        </div>
                        
                        {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmReasoning && (
                          <div className="mt-3 pt-2 border-t border-purple-200">
                            <div className="font-semibold mb-1">計算根拠:</div>
                            <div className="whitespace-pre-wrap text-purple-700">
                              {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmReasoning}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 旧LLM調整（互換性のため残す） */}
                  {(extSeo.advancedSeo.contentSeo as any).scoreBreakdown.llmAdjustments?.map((adjustment: any, i: number) => (
                    <div key={i} className="p-3 bg-purple-50 rounded border border-purple-200">
                      <div className="flex items-center justify-between text-purple-800">
                        <span>🤖 LLMによる動的調整</span>
                        <span className="font-bold">{adjustment.adjustment > 0 ? '+' : ''}{adjustment.adjustment}点</span>
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        理由: {adjustment.reason}
                      </div>
                      <div className="text-xs text-purple-600">
                        {adjustment.originalScore}点 → {adjustment.finalScore}点
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded font-bold border-t-2 border-gray-300">
                    <span>最終スコア</span>
                    <span className="text-xl text-gray-900">{extSeo.advancedSeo.contentSeo.score}点</span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">コンテンツ量</span>
                  <span className={extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'comprehensive' ? 'text-green-600' : extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'optimal' ? 'text-green-600' : extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'adequate' ? 'text-yellow-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.contentSeo.items.wordCount.value}語 ({extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'thin' ? '薄い' : extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'adequate' ? '適切' : extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'optimal' ? '最適' : '包括的'})
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">画像</span>
                  <span className={extSeo.advancedSeo.contentSeo.items.multimedia.images > 0 ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.contentSeo.items.multimedia.images}個
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">リスト構造</span>
                  <span className={extSeo.advancedSeo.contentSeo.items.lists.ordered + extSeo.advancedSeo.contentSeo.items.lists.unordered > 0 ? 'text-green-600' : 'text-red-600'}>
                    順序: {extSeo.advancedSeo.contentSeo.items.lists.ordered}個, 箇条書き: {extSeo.advancedSeo.contentSeo.items.lists.unordered}個
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">テーブル</span>
                  <span className={extSeo.advancedSeo.contentSeo.items.tables.count > 0 ? 'text-green-600' : 'text-gray-600'}>
                    {extSeo.advancedSeo.contentSeo.items.tables.count}個 (キャプション付き: {extSeo.advancedSeo.contentSeo.items.tables.withCaption}個)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ユーザー体験詳細 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👥</span>
              ユーザー体験（{extSeo.advancedSeo.userExperience.score}点）
              <button
                onClick={() => toggleExpand('uxSeoBreakdown')}
                className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {expandedItems.has('uxSeoBreakdown') ? '詳細を閉じる' : 'スコア詳細'}
              </button>
            </h4>
            
            {/* スコア根拠 */}
            {expandedItems.has('uxSeoBreakdown') && (extSeo.advancedSeo as any).scoreReasoning?.ux && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-900">
                  <div className="font-semibold mb-1">🤖 LLMスコア算出根拠:</div>
                  <div className="whitespace-pre-wrap">{(extSeo.advancedSeo as any).scoreReasoning.ux}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">パンくずリスト</span>
                  <span className={extSeo.advancedSeo.userExperience.items.navigation.breadcrumbs ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.userExperience.items.navigation.breadcrumbs ? '✅ あり' : '❌ なし'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">目次（TOC）</span>
                  <span className={extSeo.advancedSeo.userExperience.items.navigation.toc ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.userExperience.items.navigation.toc ? '✅ あり' : '❌ なし'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">スキップリンク</span>
                  <span className={extSeo.advancedSeo.userExperience.items.accessibility.skipLinks ? 'text-green-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.userExperience.items.accessibility.skipLinks ? '✅ あり' : '❌ なし'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">ARIA属性</span>
                  <span className={extSeo.advancedSeo.userExperience.items.accessibility.ariaLabels > 3 ? 'text-green-600' : extSeo.advancedSeo.userExperience.items.accessibility.ariaLabels > 0 ? 'text-yellow-600' : 'text-red-600'}>
                    {extSeo.advancedSeo.userExperience.items.accessibility.ariaLabels}個
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 総合的な改善提案 */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <h4 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
              <span className="mr-2">💡</span>
              優先すべき改善アクション
            </h4>
            <div className="space-y-2 text-sm">
              {!extSeo.advancedSeo.technicalSeo.items.canonicalUrl.exists && (
                <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-yellow-200">
                  <span className="text-red-500 font-bold text-xs">高</span>
                  <div>
                    <div className="font-medium text-gray-900">Canonicalタグの設定</div>
                    <div className="text-gray-600 text-xs mt-1">重複コンテンツを防ぎ、SEO評価を正しく集約するため</div>
                  </div>
                </div>
              )}
              {!extSeo.advancedSeo.technicalSeo.items.jsonLd.exists && (
                <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-yellow-200">
                  <span className="text-orange-500 font-bold text-xs">中</span>
                  <div>
                    <div className="font-medium text-gray-900">構造化データ（JSON-LD）の追加</div>
                    <div className="text-gray-600 text-xs mt-1">検索結果でのリッチスニペット表示を可能にする</div>
                  </div>
                </div>
              )}
              {extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'thin' && (
                <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-yellow-200">
                  <span className="text-red-500 font-bold text-xs">高</span>
                  <div>
                    <div className="font-medium text-gray-900">コンテンツ量の充実</div>
                    <div className="text-gray-600 text-xs mt-1">現在{extSeo.advancedSeo.contentSeo.items.wordCount.value}語 → より詳細で価値のある情報を追加</div>
                  </div>
                </div>
              )}
              {!extSeo.advancedSeo.userExperience.items.navigation.breadcrumbs && (
                <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-yellow-200">
                  <span className="text-yellow-500 font-bold text-xs">低</span>
                  <div>
                    <div className="font-medium text-gray-900">パンくずリストの追加</div>
                    <div className="text-gray-600 text-xs mt-1">ユーザビリティとクローラビリティの向上</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 評価項目完了状況 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              SEO評価項目完了状況
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-gray-800 mb-3">🔧 技術的SEO</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Canonical URL</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.technicalSeo.items.canonicalUrl.exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.technicalSeo.items.canonicalUrl.exists ? '完了' : '未完了'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>JSON-LD構造化データ</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.technicalSeo.items.jsonLd.exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.technicalSeo.items.jsonLd.exists ? '完了' : '未完了'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Open Graph</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.technicalSeo.items.openGraph.complete ? 'bg-green-100 text-green-700' : extSeo.advancedSeo.technicalSeo.items.openGraph.exists ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.technicalSeo.items.openGraph.complete ? '完了' : extSeo.advancedSeo.technicalSeo.items.openGraph.exists ? '部分' : '未完了'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Twitter Card</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.technicalSeo.items.twitterCard.exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.technicalSeo.items.twitterCard.exists ? '完了' : '未完了'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>HTTPS/SSL</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.technicalSeo.items.ssl.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.technicalSeo.items.ssl.enabled ? '完了' : '未完了'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-3">📝 コンテンツ & UX</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>文字数評価</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'comprehensive' || extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'optimal' ? 'bg-green-100 text-green-700' : extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'adequate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.contentSeo.items.wordCount.value}語 ({extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'thin' ? '少ない' : extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'adequate' ? '適切' : extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'optimal' ? '最適' : '包括的'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>画像要素</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.contentSeo.items.multimedia.images > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.contentSeo.items.multimedia.images}個
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>リスト構造</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${(extSeo.advancedSeo.contentSeo.items.lists.ordered + extSeo.advancedSeo.contentSeo.items.lists.unordered) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.contentSeo.items.lists.ordered + extSeo.advancedSeo.contentSeo.items.lists.unordered}個
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>パンくずリスト</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.userExperience.items.navigation.breadcrumbs ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.userExperience.items.navigation.breadcrumbs ? '完了' : '未完了'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>目次（TOC）</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${extSeo.advancedSeo.userExperience.items.navigation.toc ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {extSeo.advancedSeo.userExperience.items.navigation.toc ? '完了' : '未完了'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>📈 SEO完了率：</span>
                  <span className="font-semibold text-lg">
                    {Math.round(seoOverall)}% 
                    <span className="text-xs ml-1">
                      ({seoOverall >= 90 ? '優秀' : seoOverall >= 70 ? '良好' : seoOverall >= 50 ? '改善必要' : '要対策'})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* チェックリスト */}
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.label} className="border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-800">{item.label}</span>
              <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${getScoreColor(item.score)}`}>
                {item.score}
              </span>
            </div>

            {item.issues && item.issues.length > 0 && (
              <ul className="text-sm text-red-600 space-y-1">
                {item.issues.map((issue, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    {issue}
                  </li>
                ))}
              </ul>
            )}

            {item.suggestions && item.suggestions.length > 0 && (
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                {item.suggestions.map((sug, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2">💡</span>
                    {sug}
                  </li>
                ))}
              </ul>
            )}

            {/* HTMLフィードバック */}
            {item.htmlFix && (
              <div className="mt-3">
                <button
                  onClick={() => toggleExpand(item.label)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <span className="mr-1">{expandedItems.has(item.label) ? '▼' : '▶'}</span>
                  修正HTMLコードを表示
                </button>
                {expandedItems.has(item.label) && (
                  <div className="mt-2 relative">
                    <button
                      onClick={() => copyToClipboard(item.htmlFix || '')}
                      className="absolute top-2 right-2 text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                      コピー
                    </button>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                      {item.htmlFix}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {item.score === 100 && (
              <p className="text-sm text-green-600 flex items-center">
                <span className="mr-2">✅</span>
                問題なし
              </p>
            )}
          </div>
        ))}
      </div>

      {/* OGP */}
      {extSeo.ogp && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">OGP（SNSシェア）</span>
            <span className={`px-2 py-1 rounded text-sm font-bold ${extSeo.ogp.hasOgp ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              {extSeo.ogp.hasOgp ? '設定済' : '未設定'}
            </span>
          </div>
          {extSeo.ogp.issues && extSeo.ogp.issues.length > 0 && (
            <ul className="text-sm text-red-600 space-y-1">
              {extSeo.ogp.issues.map((issue, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  {issue}
                </li>
              ))}
            </ul>
          )}
          {extSeo.ogp.htmlFix && (
            <div className="mt-3">
              <button
                onClick={() => toggleExpand('ogp')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <span className="mr-1">{expandedItems.has('ogp') ? '▼' : '▶'}</span>
                OGPタグのコードを表示
              </button>
              {expandedItems.has('ogp') && (
                <div className="mt-2 relative">
                  <button
                    onClick={() => copyToClipboard(extSeo.ogp?.htmlFix || '')}
                    className="absolute top-2 right-2 text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    コピー
                  </button>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                    {extSeo.ogp.htmlFix}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 構造化データ */}
      {extSeo.structured && !extSeo.structured.hasSchema && extSeo.structured.htmlFix && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">構造化データ（JSON-LD）</span>
            <span className="px-2 py-1 rounded text-sm font-bold text-yellow-600 bg-yellow-100">
              未設定
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            💡 構造化データを追加すると検索結果でリッチスニペットが表示される可能性があります
          </p>
          <div className="mt-3">
            <button
              onClick={() => toggleExpand('structured')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <span className="mr-1">{expandedItems.has('structured') ? '▼' : '▶'}</span>
              構造化データのコードを表示
            </button>
            {expandedItems.has('structured') && (
              <div className="mt-2 relative">
                <button
                  onClick={() => copyToClipboard(extSeo.structured.htmlFix || '')}
                  className="absolute top-2 right-2 text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  コピー
                </button>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                  {extSeo.structured.htmlFix}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* その他の確認項目 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-3">その他の確認項目</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <span className={extSeo.canonical.hasCanonical ? 'text-green-600' : 'text-yellow-600'}>
              {extSeo.canonical.hasCanonical ? '✅' : '⚠️'}
            </span>
            <span className="ml-2">
              Canonical URL: {extSeo.canonical.hasCanonical ? extSeo.canonical.url : '未設定'}
            </span>
            {!extSeo.canonical.hasCanonical && extSeo.canonical.htmlFix && (
              <button
                onClick={() => copyToClipboard(extSeo.canonical.htmlFix || '')}
                className="ml-2 text-xs text-blue-600 hover:underline"
              >
                [コードをコピー]
              </button>
            )}
          </div>
          <div className="flex items-center">
            <span className={extSeo.structured.hasSchema ? 'text-green-600' : 'text-yellow-600'}>
              {extSeo.structured.hasSchema ? '✅' : '⚠️'}
            </span>
            <span className="ml-2">
              構造化データ: {extSeo.structured.hasSchema ? extSeo.structured.types.join(', ') : '未設定'}
            </span>
          </div>
          {extSeo.robots.issues && extSeo.robots.issues.length > 0 && (
            <div className="flex items-center text-red-600">
              <span>🚫</span>
              <span className="ml-2">{extSeo.robots.issues.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 見出し構造のプレビュー */}
      {extSeo.headings.structure && extSeo.headings.structure.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-3 text-blue-800">現在の見出し構造</h3>
          <ul className="text-sm space-y-1 font-mono">
            {extSeo.headings.structure.map((h, i) => (
              <li key={i} className={h.startsWith('H1') ? 'text-blue-800 font-bold' : 'text-blue-600 pl-4'}>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
