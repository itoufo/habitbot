import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  line_id: string
  name: string | null
  plan: 'free' | 'standard' | 'premium' | 'team'
  character_type: 'angel' | 'coach' | 'friend' | 'analyst'
  created_at: string
  updated_at: string
}

interface Habit {
  id: string
  title: string
  reminder_time: string | null
  is_active: boolean
  streak_count: number
  last_completed_date: string | null
  created_at: string
}

interface Log {
  id: string
  date: string
  status: boolean
  note: string | null
  habit_title: string
}

interface AIFeedback {
  id: string
  message: string
  sentiment: number
  feedback_date: string
  created_at: string
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [recentLogs, setRecentLogs] = useState<Log[]>([])
  const [recentFeedback, setRecentFeedback] = useState<AIFeedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchUserDetail()
    }
  }, [id])

  async function fetchUserDetail() {
    setLoading(true)
    try {
      // Fetch user
      const { data: userData, error: userError } = await supabase
        .from('habit_users')
        .select('*')
        .eq('id', id)
        .single()

      if (userError) throw userError
      setUser(userData)

      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habit_habits')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      if (habitsError) throw habitsError
      setHabits(habitsData || [])

      // Fetch recent logs with habit titles
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('id, date, status, note, habit_id')
        .in(
          'habit_id',
          (habitsData || []).map((h) => h.id)
        )
        .order('date', { ascending: false })
        .limit(10)

      if (logsError) throw logsError

      // Join with habit titles
      const logsWithTitles = (logsData || []).map((log) => {
        const habit = habitsData?.find((h) => h.id === log.habit_id)
        return {
          ...log,
          habit_title: habit?.title || '不明な習慣',
        }
      })
      setRecentLogs(logsWithTitles)

      // Fetch AI feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('habit_ai_feedback')
        .select('*')
        .eq('user_id', id)
        .order('feedback_date', { ascending: false })
        .limit(5)

      if (feedbackError) throw feedbackError
      setRecentFeedback(feedbackData || [])
    } catch (error) {
      console.error('Error fetching user detail:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ユーザーが見つかりませんでした</p>
          <Link to="/users" className="text-blue-600 hover:text-blue-900">
            ユーザー一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  const totalStreak = habits.reduce((sum, h) => sum + h.streak_count, 0)
  const activeHabits = habits.filter((h) => h.is_active).length
  const completionRate =
    recentLogs.length > 0
      ? Math.round((recentLogs.filter((l) => l.status).length / recentLogs.length) * 100)
      : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/users" className="text-blue-600 hover:text-blue-900 mb-4 inline-block">
            ← ユーザー一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{user.name || '名前未設定'}</h1>
          <p className="mt-2 text-gray-600">LINE ID: {user.line_id}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500 mb-2">プラン</div>
            <div className="text-2xl font-bold text-gray-900">{user.plan.toUpperCase()}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500 mb-2">習慣数</div>
            <div className="text-2xl font-bold text-gray-900">
              {activeHabits} / {habits.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">アクティブ / 全体</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500 mb-2">合計ストリーク</div>
            <div className="text-2xl font-bold text-gray-900">{totalStreak}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500 mb-2">完了率</div>
            <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
            <div className="text-xs text-gray-500 mt-1">直近10件</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Habits List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">習慣一覧</h2>
            <div className="space-y-4">
              {habits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">習慣がありません</p>
              ) : (
                habits.map((habit) => (
                  <div
                    key={habit.id}
                    className={`border rounded-lg p-4 ${
                      habit.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{habit.title}</h3>
                        <div className="mt-2 text-sm text-gray-600">
                          <div>リマインダー: {habit.reminder_time || '未設定'}</div>
                          <div>ストリーク: {habit.streak_count}日</div>
                          {habit.last_completed_date && (
                            <div>
                              最終完了:{' '}
                              {new Date(habit.last_completed_date).toLocaleDateString('ja-JP')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            habit.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {habit.is_active ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            {/* Recent Logs */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">最近の記録</h2>
              <div className="space-y-3">
                {recentLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">記録がありません</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{log.habit_title}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(log.date).toLocaleDateString('ja-JP')}
                          </div>
                          {log.note && (
                            <div className="text-sm text-gray-500 mt-1">メモ: {log.note}</div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            log.status
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status ? '完了' : '未完了'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Feedback */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AIフィードバック</h2>
              <div className="space-y-4">
                {recentFeedback.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">フィードバックがありません</p>
                ) : (
                  recentFeedback.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="text-sm text-gray-600 mb-2">
                        {new Date(feedback.feedback_date).toLocaleDateString('ja-JP')}
                      </div>
                      <p className="text-gray-900">{feedback.message}</p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-gray-500">
                          感情スコア: {(feedback.sentiment * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
