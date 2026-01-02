import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, 
  Building2, 
  CreditCard, 
  Bell, 
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

import { ProfileSettings } from './settings/ProfileSettings'
import { TenantSettings } from './settings/TenantSettings'
import { BillingSettings } from './settings/BillingSettings'
import { NotificationSettings } from './settings/NotificationSettings'
import { SecuritySettings } from './settings/SecuritySettings'

interface ProfileSettingsData {
  display_name: string
  avatar_url: string
}

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

export function Settings() {
  const { user, profile, tenant } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // プロファイル設定
  const [profileSettings, setProfileSettings] = useState<ProfileSettingsData>({
    display_name: '',
    avatar_url: ''
  })

  // テナント設定
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsData>({
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

  // メッセージの自動非表示
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const tabs = [
    { id: 'profile', label: 'プロファイル', icon: User },
    { id: 'tenant', label: 'テナント', icon: Building2 },
    { id: 'billing', label: '利用状況', icon: CreditCard },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'security', label: 'セキュリティ', icon: Shield }
  ]

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">設定</h1>

      {/* メッセージ表示 */}
      {message && (
        <div className={`
          mb-6 p-4 rounded-lg flex items-center gap-3
          ${message.type === 'success' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'}
        `}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
          {activeTab === 'profile' && (
            <ProfileSettings
              user={user}
              profileSettings={profileSettings}
              setProfileSettings={setProfileSettings}
              loading={loading}
              setLoading={setLoading}
              setMessage={setMessage}
            />
          )}

          {activeTab === 'tenant' && (
            <TenantSettings
              tenant={tenant}
              tenantSettings={tenantSettings}
              setTenantSettings={setTenantSettings}
              loading={loading}
              setLoading={setLoading}
              setMessage={setMessage}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSettings tenant={tenant} />
          )}

          {activeTab === 'notifications' && (
            <NotificationSettings
              user={user}
              notifications={notifications}
              setNotifications={setNotifications}
              loading={loading}
              setLoading={setLoading}
              setMessage={setMessage}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettings
              loading={loading}
              setLoading={setLoading}
              setMessage={setMessage}
            />
          )}
        </div>
      </div>
    </div>
  )
}