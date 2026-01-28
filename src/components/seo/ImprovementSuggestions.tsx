interface ImprovementSuggestionsProps {
  advancedSeo: {
    technicalSeo: { items: any }
    contentSeo: { items: any }
    userExperience: { items: any }
  }
}

export function ImprovementSuggestions({ advancedSeo }: ImprovementSuggestionsProps) {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
      <h4 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
        <span className="mr-2">💡</span>
        優先すべき改善アクション
      </h4>
      <div className="space-y-2 text-sm">
        {!advancedSeo.technicalSeo.items.canonicalUrl.exists && (
          <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-yellow-200">
            <span className="text-red-500 font-bold text-xs">高</span>
            <div>
              <div className="font-medium text-gray-900">Canonicalタグの設定</div>
              <div className="text-gray-600 text-xs mt-1">重複コンテンツを防ぎ、SEO評価を正しく集約するため</div>
            </div>
          </div>
        )}
        {!advancedSeo.technicalSeo.items.jsonLd.exists && (
          <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-yellow-200">
            <span className="text-orange-500 font-bold text-xs">中</span>
            <div>
              <div className="font-medium text-gray-900">構造化データ（JSON-LD）の追加</div>
              <div className="text-gray-600 text-xs mt-1">検索結果でのリッチスニペット表示を可能にする</div>
            </div>
          </div>
        )}
        {advancedSeo.contentSeo.items.wordCount.rating === 'thin' && (
          <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-yellow-200">
            <span className="text-red-500 font-bold text-xs">高</span>
            <div>
              <div className="font-medium text-gray-900">コンテンツ量の充実</div>
              <div className="text-gray-600 text-xs mt-1">現在{advancedSeo.contentSeo.items.wordCount.value}語 → より詳細で価値のある情報を追加</div>
            </div>
          </div>
        )}
        {!advancedSeo.userExperience.items.navigation.breadcrumbs && (
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
  )
}