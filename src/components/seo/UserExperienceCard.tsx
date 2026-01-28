import { useState } from 'react'

interface UserExperienceProps {
  userExperience: {
    score: number
    items: {
      coreWebVitals: {
        lcp: { value?: number; rating?: string }
        fid: { value?: number; rating?: string }
        cls: { value?: number; rating?: string }
      }
      accessibility: {
        ariaLabels: number
        skipLinks: boolean
        contrastRatio: boolean
        formLabels: boolean
      }
      navigation: {
        breadcrumbs: boolean
        toc: boolean // Table of Contents
        pagination: boolean
        searchBox: boolean
      }
    }
  }
  scoreReasoning?: any
}

export function UserExperienceCard({ userExperience, scoreReasoning }: UserExperienceProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">👥</span>
        ユーザー体験（{userExperience.score}点）
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {expanded ? '詳細を閉じる' : 'スコア詳細'}
        </button>
      </h4>
      
      {/* スコア根拠 */}
      {expanded && scoreReasoning?.ux && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-1">🤖 LLMスコア算出根拠:</div>
            <div className="whitespace-pre-wrap">{scoreReasoning.ux}</div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* アクセシビリティ */}
        <div className="space-y-3">
          <div className="font-medium text-gray-700 mb-2">アクセシビリティ</div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">ARIAラベル</span>
            <span className={userExperience.items.accessibility.ariaLabels > 0 ? 'text-green-600' : 'text-red-600'}>
              {userExperience.items.accessibility.ariaLabels}個
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">スキップリンク</span>
            <span className={userExperience.items.accessibility.skipLinks ? 'text-green-600' : 'text-red-600'}>
              {userExperience.items.accessibility.skipLinks ? '✅ あり' : '❌ なし'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">フォームラベル</span>
            <span className={userExperience.items.accessibility.formLabels ? 'text-green-600' : 'text-gray-600'}>
              {userExperience.items.accessibility.formLabels ? '✅ あり' : '➖ なし'}
            </span>
          </div>
        </div>
        
        {/* ナビゲーション */}
        <div className="space-y-3">
          <div className="font-medium text-gray-700 mb-2">ナビゲーション</div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">パンくずリスト</span>
            <span className={userExperience.items.navigation.breadcrumbs ? 'text-green-600' : 'text-gray-600'}>
              {userExperience.items.navigation.breadcrumbs ? '✅ あり' : '➖ なし'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">目次</span>
            <span className={userExperience.items.navigation.toc ? 'text-green-600' : 'text-gray-600'}>
              {userExperience.items.navigation.toc ? '✅ あり' : '➖ なし'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">検索ボックス</span>
            <span className={userExperience.items.navigation.searchBox ? 'text-green-600' : 'text-gray-600'}>
              {userExperience.items.navigation.searchBox ? '✅ あり' : '➖ なし'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}