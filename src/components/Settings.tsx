import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, 
  Building2, 
  CreditCard, 
  Bell, 
  Shield, 
  Save,
  Mail,
  Globe,
  Palette,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ProfileSettings {
  display_name: string
  avatar_url: string
}

interface TenantSettings {
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

export function Settings() {
  const { user, profile, tenant } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // プロファイル設定
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    display_name: '',
    avatar_url: ''
  })

  // テナント設定
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({
    name: '',
    slug: '',
    settings: {},
    plan: 'free',
    monthly_limit: 100
  })

  // 通知設定
  const [notifications, setNotifications] = useState({
    email_weekly_report: true,
    email_monthly_report: true,
    email_low_score_alert: true,
    alert_threshold: 60
  })

  useEffect(() => {
    if (profile) {
      setProfileSettings({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || ''
      })
    }

    if (tenant) {
      setTenantSettings({
        name: tenant.name,
        slug: tenant.slug,
        settings: tenant.settings || {},
        plan: tenant.plan,
        monthly_limit: tenant.monthly_limit
      })
    }

    loadNotificationSettings()
  }, [profile, tenant])

  async function loadNotificationSettings() {
    // 通知設定をローカルストレージから読み込み（実際はDBから）
    const saved = localStorage.getItem(`notifications_${user?.id}`)
    if (saved) {
      setNotifications(JSON.parse(saved))
    }
  }

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

      setMessage({ type: 'success', text: 'プロファイルを更新しました' })
    } catch (error) {
      console.error('Failed to save profile:', error)
      setMessage({ type: 'error', text: 'プロファイルの更新に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  async function saveTenantSettings() {
    if (!tenant) return

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
        .eq('id', tenant.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'テナント設定を更新しました' })
    } catch (error) {
      console.error('Failed to save tenant settings:', error)
      setMessage({ type: 'error', text: 'テナント設定の更新に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  async function saveNotificationSettings() {
    setLoading(true)
    setMessage(null)

    try {
      // 実際はDBに保存
      localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(notifications))
      setMessage({ type: 'success', text: '通知設定を更新しました' })
    } catch (error) {
      console.error('Failed to save notifications:', error)
      setMessage({ type: 'error', text: '通知設定の更新に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'プロファイル', icon: User },
    { id: 'tenant', label: 'テナント', icon: Building2 },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'billing', label: 'プラン', icon: CreditCard },
    { id: 'security', label: 'セキュリティ', icon: Shield }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-600 mt-2">アカウントと診断の設定を管理</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div className="p-6">
          {/* プロファイル設定 */}
          {activeTab === 'profile' && (
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
          )}

          {/* テナント設定 */}
          {activeTab === 'tenant' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">テナント設定</h3>
                
                {tenant ? (
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
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        スラッグ
                      </label>
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">{tenant.slug}</span>
                        <span className="text-sm text-gray-500">（変更不可）</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        プライマリカラー
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
                          className="h-10 w-20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        カスタムドメイン
                      </label>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://llmo.example.com"
                      />
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
                ) : (
                  <p className="text-gray-600">テナントに所属していません</p>
                )}
              </div>
            </div>
          )}

          {/* 通知設定 */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">通知設定</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notifications.email_weekly_report}
                      onChange={e => setNotifications(prev => ({
                        ...prev,
                        email_weekly_report: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-900">週次レポートをメールで受け取る</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notifications.email_monthly_report}
                      onChange={e => setNotifications(prev => ({
                        ...prev,
                        email_monthly_report: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-900">月次レポートをメールで受け取る</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notifications.email_low_score_alert}
                      onChange={e => setNotifications(prev => ({
                        ...prev,
                        email_low_score_alert: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-900">低スコアアラートをメールで受け取る</span>
                  </label>

                  {notifications.email_low_score_alert && (
                    <div className="ml-7">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        アラートしきい値
                      </label>
                      <input
                        type="number"
                        value={notifications.alert_threshold}
                        onChange={e => setNotifications(prev => ({
                          ...prev,
                          alert_threshold: parseInt(e.target.value)
                        }))}
                        min="0"
                        max="100"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">点以下</span>
                    </div>
                  )}
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
          )}

          {/* プラン */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">プラン情報</h3>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {tenant?.plan === 'enterprise' ? 'Enterprise' :
                         tenant?.plan === 'pro' ? 'Pro' : 'Free'} プラン
                      </p>
                      <p className="text-gray-600">
                        月間 {tenant?.monthly_limit || 100} 回まで診断可能
                      </p>
                    </div>
                    <CreditCard className="w-12 h-12 text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">今月の使用回数</span>
                      <span className="font-medium">23 / {tenant?.monthly_limit || 100}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(23 / (tenant?.monthly_limit || 100)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {tenant?.plan === 'free' && (
                    <button className="mt-6 w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded hover:from-purple-600 hover:to-blue-600">
                      Proプランにアップグレード
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* セキュリティ */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">セキュリティ設定</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Shield className="w-5 h-5" />
                      <p className="font-medium">二要素認証は無効です</p>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      アカウントのセキュリティを強化するため、二要素認証の有効化を推奨します
                    </p>
                    <button className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                      二要素認証を設定
                    </button>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">パスワード変更</h4>
                    <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                      パスワードを変更する
                    </button>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">最近のログイン履歴</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">2024/01/02 14:23</span>
                        <span className="text-gray-900">Tokyo, Japan</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">2024/01/01 09:15</span>
                        <span className="text-gray-900">Tokyo, Japan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}