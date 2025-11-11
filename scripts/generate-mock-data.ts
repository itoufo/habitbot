#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * HabitLine Mock Data Generator
 * Generate realistic test data for development and testing
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('HABIT_SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('HABIT_SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   HABIT_SUPABASE_URL')
  console.error('   HABIT_SUPABASE_SERVICE_ROLE_KEY')
  Deno.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Sample data
const JAPANESE_NAMES = [
  '田中太郎', '佐藤花子', '鈴木一郎', '山田美咲', '高橋健太',
  '伊藤さくら', '渡辺大輔', '中村優子', '小林翔太', '加藤愛',
  '吉田龍馬', '山本結衣', '佐々木拓也', '松本麻衣', '井上蓮'
]

const HABIT_TEMPLATES = [
  '読書10分', 'ジョギング', '筋トレ', '瞑想5分', '英語学習',
  'SNS投稿', '水2L飲む', '日記を書く', 'ストレッチ', '早起き',
  'プログラミング1時間', 'ヨガ', '資格勉強', '掃除', '料理',
  'ブログ執筆', 'ギター練習', '絵を描く', '散歩', '感謝日記'
]

const CHARACTER_TYPES = ['angel', 'coach', 'friend', 'analyst'] as const
const PLANS = ['free', 'standard', 'premium', 'team'] as const

async function generateUsers(count: number) {
  console.log(`👥 Generating ${count} users...`)

  const users = []
  for (let i = 0; i < count; i++) {
    const name = JAPANESE_NAMES[Math.floor(Math.random() * JAPANESE_NAMES.length)]
    const lineId = `U${Math.random().toString(36).substring(2, 15)}${i}`
    const plan = PLANS[Math.floor(Math.random() * PLANS.length)]
    const characterType = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)]
    const daysAgo = Math.floor(Math.random() * 90)

    users.push({
      line_id: lineId,
      name: `${name} #${i + 1}`,
      plan,
      character_type: characterType,
      created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  const { data, error } = await supabase.from('habit_users').insert(users).select()

  if (error) {
    console.error('❌ Error inserting users:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} users`)
  return data
}

async function generateHabits(users: any[]) {
  console.log(`📝 Generating habits for users...`)

  const habits = []
  for (const user of users) {
    // Each user gets 2-5 habits
    const habitCount = 2 + Math.floor(Math.random() * 4)

    for (let i = 0; i < habitCount; i++) {
      const title = HABIT_TEMPLATES[Math.floor(Math.random() * HABIT_TEMPLATES.length)]
      const hour = 6 + Math.floor(Math.random() * 18) // 6:00 - 23:59
      const minute = Math.floor(Math.random() * 60)
      const reminderTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
      const isActive = Math.random() > 0.2 // 80% active
      const streakCount = isActive ? Math.floor(Math.random() * 30) : 0
      const lastCompletedDate = isActive && streakCount > 0
        ? new Date().toISOString().split('T')[0]
        : null

      habits.push({
        user_id: user.id,
        title: `${title} ${i > 0 ? i + 1 : ''}`.trim(),
        reminder_time: reminderTime,
        is_active: isActive,
        streak_count: streakCount,
        last_completed_date: lastCompletedDate,
        created_at: new Date(new Date(user.created_at).getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
  }

  const { data, error } = await supabase.from('habit_habits').insert(habits).select()

  if (error) {
    console.error('❌ Error inserting habits:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} habits`)
  return data
}

async function generateLogs(habits: any[]) {
  console.log(`📊 Generating logs for the last 30 days...`)

  const logs = []
  const today = new Date()

  for (const habit of habits) {
    if (!habit.is_active) continue

    // Generate logs for last 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      // Completion probability based on streak (higher streak = more consistent)
      const baseRate = 0.6
      const streakBonus = (habit.streak_count / 30) * 0.3
      const completionRate = Math.min(baseRate + streakBonus, 0.95)

      const isCompleted = Math.random() < completionRate

      if (isCompleted || Math.random() < 0.3) { // Also create some incomplete logs
        const note = Math.random() < 0.1 ? getRandomNote() : null

        logs.push({
          habit_id: habit.id,
          date: dateStr,
          status: isCompleted,
          note,
          created_at: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }
  }

  // Insert in batches to avoid timeout
  const batchSize = 1000
  let totalInserted = 0

  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize)
    const { error } = await supabase.from('habit_logs').upsert(batch, {
      onConflict: 'habit_id,date',
    })

    if (error) {
      console.error('❌ Error inserting logs batch:', error)
      throw error
    }

    totalInserted += batch.length
    console.log(`   Inserted ${totalInserted}/${logs.length} logs...`)
  }

  console.log(`✅ Created ${logs.length} logs`)
}

async function generateAIFeedback(users: any[]) {
  console.log(`🤖 Generating AI feedback...`)

  const feedbacks = []
  const today = new Date()

  for (const user of users) {
    // Generate feedback for last 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      if (Math.random() > 0.7) continue // Only 70% of days have feedback

      const date = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      const message = generateFeedbackMessage(user.character_type)
      const sentiment = 0.5 + (Math.random() * 0.5) // 0.5 to 1.0

      feedbacks.push({
        user_id: user.id,
        message,
        sentiment,
        feedback_date: dateStr,
        created_at: date.toISOString(),
      })
    }
  }

  const { data, error } = await supabase.from('habit_ai_feedback').insert(feedbacks).select()

  if (error) {
    console.error('❌ Error inserting feedback:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} AI feedbacks`)
}

function getRandomNote(): string {
  const notes = [
    '調子良い！',
    '少し疲れたけど完了',
    'モチベーション高い',
    '続けるのが楽しくなってきた',
    '今日は難しかった',
    'スムーズにできた',
    '集中できた',
    'もっと頑張りたい',
  ]
  return notes[Math.floor(Math.random() * notes.length)]
}

function generateFeedbackMessage(characterType: string): string {
  const templates = {
    angel: [
      '素晴らしい！✨ 今日も頑張りましたね。明日も一緒に続けていきましょう。',
      '良い調子です💫 少しずつでも前進しています。その調子で！',
      'よくできました🌟 あなたの努力は必ず実を結びます。',
    ],
    coach: [
      'よくやった！💪 この調子で続けろ！もっと上を目指そう！',
      '気合が入ってるな！🔥 明日はさらに追い込むぞ！',
      '素晴らしいぞ！この勢いを維持しろ！限界を超えろ！',
    ],
    friend: [
      'やったね！🎉 今日もよく頑張ったよ！明日も一緒に頑張ろう！',
      'いい感じだね！😊 この調子この調子！応援してるよ！',
      'すごいよ！👏 続けてるのが素晴らしい！明日も楽しくいこう！',
    ],
    analyst: [
      '本日の達成率は良好です📊 このパフォーマンスを維持することを推奨します。',
      'データ分析の結果、順調に進捗しています📈 継続を推奨します。',
      '統計的に見て、良い傾向です📉 明日も同様のペースで実行してください。',
    ],
  }

  const messages = templates[characterType as keyof typeof templates] || templates.friend
  return messages[Math.floor(Math.random() * messages.length)]
}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...')

  // Delete in correct order due to foreign keys
  await supabase.from('habit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('habit_ai_feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('habit_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('habit_habits').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('habit_team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('habit_teams').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('habit_users').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('✅ Database cleaned')
}

async function main() {
  console.log('🚀 HabitLine Mock Data Generator\n')

  const userCount = parseInt(Deno.args[0] || '10')

  if (Deno.args.includes('--clean')) {
    await cleanDatabase()
  }

  try {
    const users = await generateUsers(userCount)
    const habits = await generateHabits(users)
    await generateLogs(habits)
    await generateAIFeedback(users)

    console.log('\n✅ Mock data generation complete!')
    console.log(`   Users: ${users.length}`)
    console.log(`   Habits: ${habits.length}`)
    console.log('\n📊 You can now use the admin dashboard to view the data.')
  } catch (error) {
    console.error('\n❌ Error generating mock data:', error)
    Deno.exit(1)
  }
}

main()
