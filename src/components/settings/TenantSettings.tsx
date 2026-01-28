import { Building2, Globe, Palette, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface TenantSettingsData {
  name: string
  slug: string
  settings: {
    logo_url?: string
    primary_color?: string
    custom_domain?: string
    notification_email?: string
  }
  plan: string
  monthly_limit: number
}

interface Props {
  tenant: any
  tenantSettings: TenantSettingsData
  setTenantSettings: React.Dispatch<React.SetStateAction<TenantSettingsData>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error', text: string } | null>>
}

export function TenantSettings({
  tenant,
  tenantSettings,
  setTenantSettings,
  loading,
  setLoading,
  setMessage
}: Props) {
  async function saveTenantSettings() {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: tenantSettings.name,
          settings: tenantSettings.settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant?.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'テナント設定を保存しました' })
    } catch (error) {
      console.error('Error saving tenant settings:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'テナント設定の保存に失敗しました' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (!tenant) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-yellow-800">テナントが設定されていません</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">テナント設定</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              テナント名
            </label>
            <input
              type="text"
              value={tenantSettings.name}
              onChange={e => setTenantSettings(prev => ({
                ...prev,
                name: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="株式会社Example"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              スラッグ（URL用ID）
            </label>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{tenantSettings.slug}</span>
              <span className="text-xs text-gray-500">（変更不可）</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カスタムドメイン
            </label>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={tenantSettings.settings.custom_domain || ''}
                onChange={e => setTenantSettings(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    custom_domain: e.target.value
                  }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プライマリーカラー
            </label>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-400" />
              <input
                type="color"
                value={tenantSettings.settings.primary_color || '#3B82F6'}
                onChange={e => setTenantSettings(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    primary_color: e.target.value
                  }
                }))}
                className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">
                {tenantSettings.settings.primary_color || '#3B82F6'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ロゴURL
            </label>
            <input
              type="url"
              value={tenantSettings.settings.logo_url || ''}
              onChange={e => setTenantSettings(prev => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  logo_url: e.target.value
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              通知メールアドレス
            </label>
            <input
              type="email"
              value={tenantSettings.settings.notification_email || ''}
              onChange={e => setTenantSettings(prev => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  notification_email: e.target.value
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <button
          onClick={saveTenantSettings}
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