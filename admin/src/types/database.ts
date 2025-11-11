// Database types for HabitLine Admin

export interface HabitUser {
  id: string
  line_id: string
  name: string | null
  plan: 'free' | 'standard' | 'premium' | 'team'
  character_type: 'angel' | 'coach' | 'friend' | 'analyst'
  created_at: string
  updated_at: string
}

export interface HabitHabit {
  id: string
  user_id: string
  title: string
  reminder_time: string | null
  is_active: boolean
  streak_count: number
  last_completed_date: string | null
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string
  status: boolean
  note: string | null
  created_at: string
  updated_at: string
}

export interface HabitAIFeedback {
  id: string
  user_id: string
  message: string
  sentiment: number | null
  feedback_date: string
  created_at: string
}

export interface HabitSchedule {
  id: string
  habit_id: string
  notify_time: string
  days: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitTeam {
  id: string
  name: string
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

export interface HabitTeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  updated_at: string
}

export interface HabitRetryQueue {
  id: string
  operation_type: string
  payload: Record<string, unknown>
  retry_count: number
  max_retries: number
  next_retry_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// Dashboard Statistics
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalHabits: number
  activeHabits: number
  completionRateToday: number
  completionRateWeek: number
  averageStreak: number
}

// User with habits
export interface UserWithHabits extends HabitUser {
  habits?: HabitHabit[]
}

// Habit with logs
export interface HabitWithLogs extends HabitHabit {
  logs?: HabitLog[]
}
