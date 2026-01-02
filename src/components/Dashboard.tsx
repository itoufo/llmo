import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Analysis } from '../types'
import { 
  Calendar, 
  FileText, 
  TrendingUp, 
  Download,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

export function Dashboard() {
  const { user, tenant } = useAuth()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    averageScore: 0,
    mostCommonIssue: ''
  })

  useEffect(() => {
    if (user) {
      loadAnalyses()
      loadStats()
    }
  }, [user, tenant])

  async function loadAnalyses() {
    try {
      const query = supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      // テナントIDがある場合はテナントの診断結果を取得
      if (tenant?.id) {
        query.eq('tenant_id', tenant.id)
      } else {
        query.eq('user_id', user?.id)
      }

      const { data, error } = await query

      if (error) throw error
      setAnalyses(data || [])
    } catch (error) {
      console.error('Failed to load analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const query = supabase
        .from('analyses')
        .select('score, created_at, result')

      if (tenant?.id) {
        query.eq('tenant_id', tenant.id)
      } else {
        query.eq('user_id', user?.id)
      }

      const { data, error } = await query

      if (error) throw error
      
      if (data && data.length > 0) {
        const thisMonthCount = data.filter(a => 
          new Date(a.created_at) >= firstDayOfMonth
        ).length

        const avgScore = data.reduce((sum, a) => sum + (a.score || 0), 0) / data.length

        // 最も多い問題を集計
        const issues: Record<string, number> = {}
        data.forEach(a => {
          if (a.result?.issues) {
            a.result.issues.forEach((issue: any) => {
              issues[issue.category] = (issues[issue.category] || 0) + 1
            })
          }
        })
        const mostCommon = Object.entries(issues)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

        setStats({
          total: data.length,
          thisMonth: thisMonthCount,
          averageScore: Math.round(avgScore),
          mostCommonIssue: mostCommon
        })
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  async function deleteAnalysis(id: string) {
    if (!confirm('この診断結果を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await loadAnalyses()
      await loadStats()
    } catch (error) {
      console.error('Failed to delete analysis:', error)
      alert('削除に失敗しました')
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  function getScoreIcon(score: number) {
    if (score >= 80) return <CheckCircle className="w-5 h-5" />
    if (score >= 60) return <AlertCircle className="w-5 h-5" />
    return <XCircle className="w-5 h-5" />
  }

  function exportCSV() {
    const csv = [
      ['日時', 'URL', 'スコア', 'タイトル', '問題数'],
      ...analyses.map(a => [
        new Date(a.created_at).toLocaleString('ja-JP'),
        a.url,
        a.score?.toString() || '',
        a.result?.metadata?.title || '',
        a.result?.issues?.length?.toString() || '0'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `llmo-doctor-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">診断ダッシュボード</h1>
        <p className="text-gray-600 mt-2">
          {tenant ? `${tenant.name} の診断履歴` : '個人の診断履歴'}
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">総診断数</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.thisMonth}</p>
          <p className="text-sm text-gray-600">今月の診断数</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.averageScore}</p>
          <p className="text-sm text-gray-600">平均スコア</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.mostCommonIssue}</p>
          <p className="text-sm text-gray-600">最も多い問題</p>
        </div>
      </div>

      {/* 診断履歴テーブル */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">最近の診断結果</h2>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Download className="w-4 h-4" />
            CSVエクスポート
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">まだ診断結果がありません</p>
            <p className="text-sm text-gray-500 mt-2">
              URLを入力して最初の診断を実行してください
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    スコア
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyses.map(analysis => (
                  <tr key={analysis.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(analysis.created_at).toLocaleString('ja-JP', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      <a
                        href={analysis.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {analysis.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-2 font-semibold ${getScoreColor(analysis.score || 0)}`}>
                        {getScoreIcon(analysis.score || 0)}
                        {analysis.score}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {analysis.result?.metadata?.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/analysis/${analysis.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                          title="詳細を表示"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAnalysis(analysis.id)}
                          className="text-red-600 hover:text-red-800"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}