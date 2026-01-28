import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { HomePage } from './components/HomePage'
import { Dashboard } from './components/Dashboard'
import { Settings } from './components/Settings'
import { UserMenu } from './components/UserMenu'
import { AuthModal } from './components/AuthModal'
import { useAuth } from './contexts/AuthContext'
import { useState } from 'react'
import { 
  Home, 
  LayoutDashboard, 
  Settings as SettingsIcon,
  Activity
} from 'lucide-react'

function Navigation() {
  const location = useLocation()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const navItems = [
    { path: '/', label: 'ホーム', icon: Home },
    { path: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard, requireAuth: true },
    { path: '/settings', label: '設定', icon: SettingsIcon, requireAuth: true },
  ]

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                LLMO Doctor
              </span>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                // Hide auth-required items if not logged in
                if (item.requireAuth && !user) {
                  return null
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
              
              {/* User Menu */}
              <div className="ml-4 pl-4 border-l border-gray-200">
                <UserMenu onLoginClick={() => setShowAuthModal(true)} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/dashboard" 
          element={
            user ? <Dashboard /> : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h2>
                  <p className="text-gray-600">ダッシュボードを利用するにはログインしてください</p>
                </div>
              </div>
            )
          } 
        />
        <Route 
          path="/settings" 
          element={
            user ? <Settings /> : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h2>
                  <p className="text-gray-600">設定を利用するにはログインしてください</p>
                </div>
              </div>
            )
          } 
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-animate">
        <AppContent />
      </div>
    </Router>
  )
}

export default App