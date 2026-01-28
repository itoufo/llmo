import { useState, useEffect } from 'react'
import { supabase, type Tenant } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function TenantSwitcher() {
  const { user, tenant: currentTenant, profile } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // ユーザーの所属テナント一覧を取得
  useEffect(() => {
    if (!user) return

    const userId = user.id
    async function loadTenants() {
      const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id, role, tenants(*)')
        .eq('user_id', userId)

      if (data) {
        const tenantList = data
          .map((tu: any) => tu.tenants)
          .filter(Boolean) as Tenant[]
        setTenants(tenantList)
      }
    }

    loadTenants()
  }, [user])

  // テナント切り替え
  async function switchTenant(tenantId: string) {
    if (!user || !profile) return
    setLoading(true)

    try {
      await supabase
        .from('profiles')
        .update({ default_tenant_id: tenantId })
        .eq('id', user.id)

      // ページをリロードして新しいテナントを反映
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch tenant:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || tenants.length <= 1) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
        <span className="font-medium text-gray-700 max-w-[120px] truncate">
          {currentTenant?.name || 'テナント選択'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
            テナント切り替え
          </div>
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setIsOpen(false)
                if (t.id !== currentTenant?.id) {
                  switchTenant(t.id)
                }
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                t.id === currentTenant?.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                t.id === currentTenant?.id ? 'bg-indigo-500' : 'bg-gray-300'
              }`}></span>
              <span className="flex-1 truncate">{t.name}</span>
              {t.id === currentTenant?.id && (
                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs text-gray-400 capitalize">{t.plan}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
