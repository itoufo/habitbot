// Shared TypeScript types for HabitLine Edge Functions

export interface HabitUser {
  id: string;
  line_id: string;
  name: string | null;
  plan: 'free' | 'standard' | 'premium' | 'team';
  character_type: 'angel' | 'coach' | 'friend' | 'analyst';
  created_at: string;
  updated_at: string;
}

export interface HabitHabit {
  id: string;
  user_id: string;
  title: string;
  reminder_time: string | null;
  is_active: boolean;
  streak_count: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  status: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitAIFeedback {
  id: string;
  user_id: string;
  message: string;
  sentiment: number | null;
  feedback_date: string;
  created_at: string;
}

export interface HabitSchedule {
  id: string;
  habit_id: string;
  notify_time: string;
  days: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitTeam {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface HabitRetryQueue {
  id: string;
  operation_type: string;
  payload: Record<string, unknown>;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// LINE Messaging API Types
export interface LINEWebhookEvent {
  type: string;
  timestamp: number;
  source: {
    type: 'user' | 'group' | 'room';
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  replyToken?: string;
  message?: {
    type: string;
    id: string;
    text?: string;
  };
  postback?: {
    data: string;
  };
}

export interface LINEWebhookBody {
  destination: string;
  events: LINEWebhookEvent[];
}

export interface LINETextMessage {
  type: 'text';
  text: string;
}

export interface LINEFlexMessage {
  type: 'flex';
  altText: string;
  contents: Record<string, unknown>;
}

export type LINEMessage = LINETextMessage | LINEFlexMessage;

// AI Prompt Types
export interface AIPromptContext {
  user_name: string;
  character_type: 'angel' | 'coach' | 'friend' | 'analyst';
  habits_completed: number;
  habits_total: number;
  streak_info: Array<{
    title: string;
    streak: number;
  }>;
  notes?: string[];
}

export interface AIFeedbackResponse {
  message: string;
  sentiment: number;
}

// Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Environment Variables
export interface EnvVars {
  HABIT_SUPABASE_URL: string;
  HABIT_SUPABASE_SERVICE_ROLE_KEY: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  HABIT_OPENAI_API_KEY: string;
  HABIT_STRIPE_WEBHOOK_SECRET?: string;
}
