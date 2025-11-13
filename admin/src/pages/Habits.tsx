import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Habit {
  id: string
  user_id: string
  title: string
  reminder_time: string | null
  is_active: boolean
  streak_count: number
  last_completed_date: string | null
  created_at: string
}

interface HabitWithUser extends Habit {
  user_name: string | null
  user_plan: string
}

export default function Habits() {
  const [habits, setHabits] = useState<HabitWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filterActive, setFilterActive] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')

  useEffect(() => {
    fetchHabits()
  }, [])

  async function fetchHabits() {
    setLoading(true)
    try {
      // Fetch all habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habit_habits')
        .select('*')
        .order('created_at', { ascending: false })

      if (habitsError) throw habitsError

      // Fetch user info for each habit
      const habitsWithUser = await Promise.all(
        (habitsData || []).map(async (habit) => {
          const { data: userData, error: userError } = await supabase
            .from('habit_users')
            .select('name, plan')
            .eq('id', habit.user_id)
            .single()

          if (userError) {
            console.error('Error fetching user:', userError)
            return {
              ...habit,
              user_name: null,
              user_plan: 'unknown',
            }
          }

          return {
            ...habit,
            user_name: userData.name,
            user_plan: userData.plan,
          }
        })
      )

      setHabits(habitsWithUser)
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedHabits = habits
    .filter((habit) => {
      if (filterActive === 'active') return habit.is_active
      if (filterActive === 'inactive') return !habit.is_active
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'streak':
          return b.streak_count - a.streak_count
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const stats = {
    total: habits.length,
    active: habits.filter((h) => h.is_active).length,
    inactive: habits.filter((h) => !h.is_active).length,
    totalStreak: habits.reduce((sum, h) => sum + h.streak_count, 0),
    avgStreak: habits.length > 0 ? habits.reduce((sum, h) => sum + h.streak_count, 0) / habits.length : 0,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">習慣管理</h1>
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">総習慣数</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">アクティブ</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">非アクティブ</div>
            <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">合計ストリーク</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalStreak}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">平均ストリーク</div>
            <div className="text-2xl font-bold text-blue-600">{stats.avgStreak.toFixed(1)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                ステータスフィルター
              </label>
              <select
                id="filter"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="active">アクティブのみ</option>
                <option value="inactive">非アクティブのみ</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                並び替え
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at">作成日（新しい順）</option>
                <option value="streak">ストリーク（多い順）</option>
                <option value="title">タイトル（ABC順）</option>
              </select>
            </div>
          </div>
        </div>

        {/* Habits Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    習慣名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ストリーク
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    リマインダー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終完了日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedHabits.map((habit) => (
                  <tr key={habit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{habit.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/users/${habit.user_id}`}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        {habit.user_name || '名前未設定'}
                      </Link>
                      <div className="text-xs text-gray-500">{habit.user_plan}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          habit.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {habit.is_active ? 'アクティブ' : '非アクティブ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{habit.streak_count}日</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {habit.reminder_time || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {habit.last_completed_date
                        ? new Date(habit.last_completed_date).toLocaleDateString('ja-JP')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(habit.created_at).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedHabits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">習慣が見つかりませんでした</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
