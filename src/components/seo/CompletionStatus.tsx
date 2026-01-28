interface CompletionStatusProps {
  advancedSeo: {
    technicalSeo: { items: any }
    performanceSeo: { items: any }
    contentSeo: { items: any }
    userExperience: { items: any }
  }
}

export function CompletionStatus({ advancedSeo }: CompletionStatusProps) {
  return (
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
              <span className={`px-2 py-1 rounded text-xs font-medium ${advancedSeo.technicalSeo.items.canonicalUrl.exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {advancedSeo.technicalSeo.items.canonicalUrl.exists ? '完了' : '未完了'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>JSON-LD構造化データ</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${advancedSeo.technicalSeo.items.jsonLd.exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {advancedSeo.technicalSeo.items.jsonLd.exists ? '完了' : '未完了'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Open Graph</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${advancedSeo.technicalSeo.items.openGraph.complete ? 'bg-green-100 text-green-700' : advancedSeo.technicalSeo.items.openGraph.exists ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {advancedSeo.technicalSeo.items.openGraph.complete ? '完了' : advancedSeo.technicalSeo.items.openGraph.exists ? '部分' : '未完了'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Twitter Card</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${advancedSeo.technicalSeo.items.twitterCard.exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {advancedSeo.technicalSeo.items.twitterCard.exists ? '完了' : '未完了'}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="font-semibold text-gray-800 mb-3">⚡ パフォーマンス</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>HTMLサイズ</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${advancedSeo.performanceSeo.items.htmlSize.rating === 'optimal' ? 'bg-green-100 text-green-700' : advancedSeo.performanceSeo.items.htmlSize.rating === 'heavy' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {advancedSeo.performanceSeo.items.htmlSize.rating === 'optimal' ? '最適' : advancedSeo.performanceSeo.items.htmlSize.rating === 'heavy' ? '重い' : '過重'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>インラインCSS</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${!advancedSeo.performanceSeo.items.inlineCSS.excessive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {!advancedSeo.performanceSeo.items.inlineCSS.excessive ? '適切' : '多い'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>インラインJS</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${!advancedSeo.performanceSeo.items.inlineJS.excessive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {!advancedSeo.performanceSeo.items.inlineJS.excessive ? '適切' : '多い'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>リンク構造</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${advancedSeo.performanceSeo.items.internalLinks.count > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                内部: {advancedSeo.performanceSeo.items.internalLinks.count} / 外部: {advancedSeo.performanceSeo.items.externalLinks.count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}