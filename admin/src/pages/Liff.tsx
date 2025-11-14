import { useState, useEffect } from 'react'
import { useLiff } from '../hooks/useLiff'
import { supabase } from '../lib/supabase'

// LIFF IDは環境変数から取得（後で設定）
const LIFF_ID = import.meta.env.VITE_LIFF_ID || '2006618060-4klp5W8G'

interface Habit {
  id: string
  title: string
  reminder_time: string | null
  is_active: boolean
  streak_count: number
  created_at: string
}

export default function Liff() {
  const { isLoggedIn, isReady, userId, displayName, error } = useLiff(LIFF_ID)
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [reminderTime, setReminderTime] = useState('')

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchHabits()
    }
  }, [isLoggedIn, userId])

  const fetchHabits = async () => {
    try {
      setLoading(true)

      // Get user from database
      const { data: user } = await supabase
        .from('habit_users')
        .select('id')
        .eq('line_id', userId)
        .single()

      if (!user) {
        console.error('User not found')
        return
      }

      // Get habits
      const { data, error } = await supabase
        .from('habit_habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHabits(data || [])
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const addHabit = async () => {
    if (!newHabitTitle.trim()) return

    try {
      const { data: user } = await supabase
        .from('habit_users')
        .select('id')
        .eq('line_id', userId)
        .single()

      if (!user) return

      const { error } = await supabase
        .from('habit_habits')
        .insert({
          user_id: user.id,
          title: newHabitTitle,
          is_active: true,
        })

      if (error) throw error

      setNewHabitTitle('')
      fetchHabits()
    } catch (error) {
      console.error('Error adding habit:', error)
    }
  }

  const updateReminderTime = async (habitId: string, time: string) => {
    try {
      // Convert JST to UTC (JST is UTC+9)
      const [hours, minutes] = time.split(':').map(Number)
      const utcHours = (hours - 9 + 24) % 24
      const utcTime = `${String(utcHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

      const { error } = await supabase
        .from('habit_habits')
        .update({ reminder_time: utcTime })
        .eq('id', habitId)

      if (error) throw error

      setEditingHabit(null)
      setReminderTime('')
      fetchHabits()
    } catch (error) {
      console.error('Error updating reminder:', error)
    }
  }

  const toggleHabitActive = async (habitId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('habit_habits')
        .update({ is_active: !isActive })
        .eq('id', habitId)

      if (error) throw error
      fetchHabits()
    } catch (error) {
      console.error('Error toggling habit:', error)
    }
  }

  const deleteHabit = async (habitId: string) => {
    if (!confirm('この習慣を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('habit_habits')
        .delete()
        .eq('id', habitId)

      if (error) throw error
      fetchHabits()
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  const formatReminderTime = (time: string | null) => {
    if (!time) return '未設定'
    const [hours, minutes] = time.split(':')
    const jstHours = (parseInt(hours) + 9) % 24
    return `${String(jstHours).padStart(2, '0')}:${minutes}`
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">エラー</h2>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">HabitLine</h1>
        <p className="text-sm opacity-90">ようこそ、{displayName}さん！</p>
      </div>

      {/* Add Habit Form */}
      <div className="p-4 bg-white border-b">
        <div className="flex gap-2">
          <input
            type="text"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="新しい習慣を追加..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => e.key === 'Enter' && addHabit()}
          />
          <button
            onClick={addHabit}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            追加
          </button>
        </div>
      </div>

      {/* Habits List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-500">読み込み中...</p>
        ) : habits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">まだ習慣が登録されていません</p>
            <p className="text-sm text-gray-400">上のフォームから習慣を追加しましょう！</p>
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
                habit.is_active ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{habit.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      🔥 {habit.streak_count}日連続
                    </span>
                    <span className="flex items-center gap-1">
                      ⏰ {formatReminderTime(habit.reminder_time)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleHabitActive(habit.id, habit.is_active)}
                    className={`px-3 py-1 rounded text-sm ${
                      habit.is_active
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {habit.is_active ? '⏸' : '▶'}
                  </button>
                </div>
              </div>

              {/* Reminder Time Editor */}
              {editingHabit?.id === habit.id ? (
                <div className="mt-3 pt-3 border-t">
                  <label className="block text-sm font-medium mb-2">
                    リマインド時刻（JST）
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => updateReminderTime(habit.id, reminderTime)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingHabit(null)
                        setReminderTime('')
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t flex gap-2">
                  <button
                    onClick={() => {
                      setEditingHabit(habit)
                      const time = habit.reminder_time
                        ? formatReminderTime(habit.reminder_time)
                        : '07:00'
                      setReminderTime(time)
                    }}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    ⏰ 時刻変更
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    🗑 削除
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
