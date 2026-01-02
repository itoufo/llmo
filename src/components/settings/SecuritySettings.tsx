import { Shield, Key, Smartphone, Save } from 'lucide-react'

interface Props {
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error', text: string } | null>>
}

export function SecuritySettings({ loading, setLoading, setMessage }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">セキュリティ設定</h3>
        
        <div className="space-y-6">
          {/* パスワード変更 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">パスワード変更</h4>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              パスワードを変更するには、現在のパスワードと新しいパスワードを入力してください
            </p>
            
            <div className="space-y-3">
              <input
                type="password"
                placeholder="現在のパスワード"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="新しいパスワード"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="新しいパスワード（確認）"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              disabled={loading}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              パスワードを変更
            </button>
          </div>
          
          {/* 2要素認証 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">2要素認証</h4>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              2要素認証を有効にすると、ログイン時に追加の確認が必要になります
            </p>
            
            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-4">
              ✅ 2要素認証は有効です
            </div>
            
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
              設定を変更
            </button>
          </div>
          
          {/* セッション管理 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">アクティブセッション</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">Chrome - MacOS</p>
                  <p className="text-xs text-gray-500">Tokyo, Japan • 現在のセッション</p>
                </div>
                <span className="text-xs text-green-600 font-medium">アクティブ</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">Safari - iPhone</p>
                  <p className="text-xs text-gray-500">Tokyo, Japan • 2時間前</p>
                </div>
                <button className="text-xs text-red-600 hover:underline">
                  終了
                </button>
              </div>
            </div>
            
            <button className="mt-4 text-sm text-red-600 hover:underline">
              すべてのセッションを終了
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}