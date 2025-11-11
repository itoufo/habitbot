import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DashboardStats, HabitUser } from '../types/database'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<HabitUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // Fetch stats
      const [usersResult, habitsResult, logsResult] = await Promise.all([
        supabase.from('habit_users').select('id, created_at'),
        supabase.from('habit_habits').select('id, is_active, streak_count'),
        supabase
          .from('habit_logs')
          .select('date, status')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      ])

      // Calculate stats
      const totalUsers = usersResult.data?.length || 0
      const activeUsers = usersResult.data?.filter(
        (u) => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0

      const totalHabits = habitsResult.data?.length || 0
      const activeHabits = habitsResult.data?.filter((h) => h.is_active).length || 0
      const averageStreak = totalHabits > 0
        ? (habitsResult.data?.reduce((sum, h) => sum + h.streak_count, 0) || 0) / totalHabits
        : 0

      const today = new Date().toISOString().split('T')[0]
      const logsToday = logsResult.data?.filter((l) => l.date === today) || []
      const completionRateToday = logsToday.filter((l) => l.status).length / (logsToday.length || 1)

      const logsWeek = logsResult.data || []
      const completionRateWeek = logsWeek.filter((l) => l.status).length / (logsWeek.length || 1)

      setStats({
        totalUsers,
        activeUsers,
        totalHabits,
        activeHabits,
        completionRateToday: completionRateToday * 100,
        completionRateWeek: completionRateWeek * 100,
        averageStreak,
      })

      // Fetch recent users
      const { data: users } = await supabase
        .from('habit_users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentUsers(users || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">HabitLine ダッシュボード</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="総ユーザー数" value={stats?.totalUsers || 0} />
          <StatCard title="アクティブユーザー" value={stats?.activeUsers || 0} suffix=" (30日)" />
          <StatCard title="総習慣数" value={stats?.totalHabits || 0} />
          <StatCard title="アクティブ習慣" value={stats?.activeHabits || 0} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="本日の達成率"
            value={`${stats?.completionRateToday.toFixed(1) || 0}%`}
            color="blue"
          />
          <MetricCard
            title="今週の達成率"
            value={`${stats?.completionRateWeek.toFixed(1) || 0}%`}
            color="green"
          />
          <MetricCard
            title="平均連続日数"
            value={`${stats?.averageStreak.toFixed(1) || 0}日`}
            color="purple"
          />
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近登録されたユーザー</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    プラン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    キャラクター
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadgeColor(user.plan)}`}
                      >
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCharacterEmoji(user.character_type)} {user.character_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, suffix = '' }: { title: string; value: number; suffix?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">
        {value.toLocaleString()}
        <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>
      </p>
    </div>
  )
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className={`rounded-lg shadow p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

function getPlanBadgeColor(plan: string): string {
  switch (plan) {
    case 'free':
      return 'bg-gray-100 text-gray-800'
    case 'standard':
      return 'bg-blue-100 text-blue-800'
    case 'premium':
      return 'bg-purple-100 text-purple-800'
    case 'team':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getCharacterEmoji(character: string): string {
  switch (character) {
    case 'angel':
      return '✨'
    case 'coach':
      return '💪'
    case 'friend':
      return '🤝'
    case 'analyst':
      return '📊'
    default:
      return '👤'
  }
}
