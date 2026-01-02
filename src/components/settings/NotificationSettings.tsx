import { Bell, Save } from 'lucide-react'

interface NotificationData {
  email_weekly_report: boolean
  email_monthly_report: boolean
  email_low_score_alert: boolean
  alert_threshold: number
}

interface Props {
  user: any
  notifications: NotificationData
  setNotifications: React.Dispatch<React.SetStateAction<NotificationData>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error', text: string } | null>>
}

export function NotificationSettings({
  user,
  notifications,
  setNotifications,
  loading,
  setLoading,
  setMessage
}: Props) {
  async function saveNotificationSettings() {
    setLoading(true)
    setMessage(null)

    try {
      // 実際はDBに保存
      localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(notifications))
      
      setMessage({ type: 'success', text: '通知設定を保存しました' })
    } catch (error) {
      console.error('Error saving notifications:', error)
      setMessage({ 
        type: 'error', 
        text: '通知設定の保存に失敗しました' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">通知設定</h3>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">メール通知</h4>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.email_weekly_report}
                  onChange={e => setNotifications(prev => ({
                    ...prev,
                    email_weekly_report: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  週次レポート（毎週月曜日）
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.email_monthly_report}
                  onChange={e => setNotifications(prev => ({
                    ...prev,
                    email_monthly_report: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  月次レポート（毎月1日）
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.email_low_score_alert}
                  onChange={e => setNotifications(prev => ({
                    ...prev,
                    email_low_score_alert: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  低スコアアラート
                </span>
              </label>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">アラート設定</h4>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                アラートしきい値（点数）
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={notifications.alert_threshold}
                  onChange={e => setNotifications(prev => ({
                    ...prev,
                    alert_threshold: parseInt(e.target.value)
                  }))}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium text-gray-900">
                  {notifications.alert_threshold}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                スコアがこの値以下の場合にアラートを送信します
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={saveNotificationSettings}
          disabled={loading}
          className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
      </div>
    </div>
  )
}