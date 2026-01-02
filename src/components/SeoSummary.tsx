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

      {/* Advanced SEO スコア */}
      {extSeo.advancedSeo && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center">
            <span className="mr-2">🔍</span>
            詳細SEO診断スコア
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="text-sm text-gray-600 mb-1">技術的SEO</div>
              <div className={`text-2xl font-bold ${extSeo.advancedSeo.technicalSeo.score >= 80 ? 'text-green-600' : extSeo.advancedSeo.technicalSeo.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {extSeo.advancedSeo.technicalSeo.score}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {!extSeo.advancedSeo.technicalSeo.items.canonicalUrl.exists && '❌ Canonical '}
                {!extSeo.advancedSeo.technicalSeo.items.jsonLd.exists && '❌ JSON-LD '}
                {!extSeo.advancedSeo.technicalSeo.items.openGraph.complete && '⚠️ OGP不完全'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="text-sm text-gray-600 mb-1">パフォーマンス</div>
              <div className={`text-2xl font-bold ${extSeo.advancedSeo.performanceSeo.score >= 80 ? 'text-green-600' : extSeo.advancedSeo.performanceSeo.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {extSeo.advancedSeo.performanceSeo.score}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {extSeo.advancedSeo.performanceSeo.items.htmlSize.rating === 'too-heavy' && '⚠️ HTMLサイズ大 '}
                {extSeo.advancedSeo.performanceSeo.items.inlineJS.excessive && '⚠️ インラインJS多'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="text-sm text-gray-600 mb-1">コンテンツSEO</div>
              <div className={`text-2xl font-bold ${extSeo.advancedSeo.contentSeo.score >= 80 ? 'text-green-600' : extSeo.advancedSeo.contentSeo.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {extSeo.advancedSeo.contentSeo.score}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'thin' && '❌ コンテンツ少 '}
                {extSeo.advancedSeo.contentSeo.items.multimedia.images === 0 && '❌ 画像なし'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="text-sm text-gray-600 mb-1">ユーザー体験</div>
              <div className={`text-2xl font-bold ${extSeo.advancedSeo.userExperience.score >= 80 ? 'text-green-600' : extSeo.advancedSeo.userExperience.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {extSeo.advancedSeo.userExperience.score}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {!extSeo.advancedSeo.userExperience.items.navigation.breadcrumbs && '❌ パンくず '}
                {!extSeo.advancedSeo.userExperience.items.accessibility.skipLinks && '❌ スキップリンク'}
              </div>
            </div>
          </div>
          
          {/* 詳細な問題点リスト */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-100">
            <h4 className="font-semibold text-gray-800 mb-2">主な改善ポイント</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              {!extSeo.advancedSeo.technicalSeo.items.canonicalUrl.exists && (
                <li>🔧 Canonicalタグを設定して重複コンテンツを防ぐ</li>
              )}
              {!extSeo.advancedSeo.technicalSeo.items.jsonLd.exists && (
                <li>🔧 構造化データ（JSON-LD）を追加してリッチスニペット表示を狙う</li>
              )}
              {extSeo.advancedSeo.performanceSeo.items.htmlSize.rating === 'too-heavy' && (
                <li>⚡ HTMLサイズを削減してページ読み込み速度を改善</li>
              )}
              {extSeo.advancedSeo.contentSeo.items.wordCount.rating === 'thin' && (
                <li>📝 コンテンツ量を増やして情報の充実度を高める（推奨: 1000語以上）</li>
              )}
              {!extSeo.advancedSeo.userExperience.items.navigation.breadcrumbs && (
                <li>🧭 パンくずリストを追加してナビゲーションを改善</li>
              )}
            </ul>
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
