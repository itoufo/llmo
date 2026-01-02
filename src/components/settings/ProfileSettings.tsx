import { User, Mail, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ProfileSettingsData {
  display_name: string
  avatar_url: string
}

interface Props {
  user: any
  profileSettings: ProfileSettingsData
  setProfileSettings: React.Dispatch<React.SetStateAction<ProfileSettingsData>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error', text: string } | null>>
}

export function ProfileSettings({ 
  user, 
  profileSettings, 
  setProfileSettings,
  loading,
  setLoading,
  setMessage
}: Props) {
  async function saveProfileSettings() {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileSettings.display_name,
          avatar_url: profileSettings.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'プロファイルを保存しました' })
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'プロファイルの保存に失敗しました' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">プロファイル設定</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表示名
            </label>
            <input
              type="text"
              value={profileSettings.display_name}
              onChange={e => setProfileSettings(prev => ({
                ...prev,
                display_name: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="山田 太郎"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{user?.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アバターURL
            </label>
            <input
              type="url"
              value={profileSettings.avatar_url}
              onChange={e => setProfileSettings(prev => ({
                ...prev,
                avatar_url: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>

        <button
          onClick={saveProfileSettings}
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