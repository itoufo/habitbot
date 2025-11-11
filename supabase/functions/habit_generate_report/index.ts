// HabitLine Weekly Report Generator - Generate and send weekly progress reports

import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { pushMessage } from '../_shared/line.ts';
import type { APIResponse } from '../_shared/types.ts';

serve(async (req: Request) => {
  try {
    const lineAccessToken = Deno.env.get('HABIT_LINE_ACCESS_TOKEN');
    if (!lineAccessToken) {
      throw new Error('Missing HABIT_LINE_ACCESS_TOKEN');
    }

    const supabase = getSupabaseClient();

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Generating weekly reports for ${startDateStr} to ${endDateStr}`);

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('habit_users')
      .select('id, line_id, name, character_type');

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users to send reports to',
          count: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Generating reports for ${users.length} users`);

    // Generate report for each user
    const results = await Promise.allSettled(
      users.map(async (user) => {
        try {
          const report = await generateUserReport(user, startDateStr, endDateStr, supabase);

          if (report) {
            await pushMessage(
              user.line_id,
              [{ type: 'text', text: report }],
              lineAccessToken
            );
            console.log(`Sent weekly report to user ${user.id}`);
          }

          return { userId: user.id, success: true };
        } catch (error) {
          console.error(`Failed to generate report for user ${user.id}:`, error);
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Weekly reports complete: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successful} reports, ${failed} failed`,
        total: users.length,
        successful,
        failed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in habit_generate_report:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateUserReport(
  user: any,
  startDate: string,
  endDate: string,
  supabase: any
): Promise<string | null> {
  // Get user's habits
  const { data: habits, error: habitsError } = await supabase
    .from('habit_habits')
    .select('id, title, streak_count')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (habitsError || !habits || habits.length === 0) {
    return null; // User has no active habits
  }

  // Get logs for the week
  const { data: logs, error: logsError } = await supabase
    .from('habit_logs')
    .select('habit_id, date, status')
    .in(
      'habit_id',
      habits.map((h: any) => h.id)
    )
    .gte('date', startDate)
    .lte('date', endDate);

  if (logsError) {
    throw logsError;
  }

  // Calculate statistics
  const stats = calculateWeeklyStats(habits, logs || []);

  // Format report based on character type
  return formatReport(user, stats);
}

function calculateWeeklyStats(habits: any[], logs: any[]) {
  const totalDays = 7;
  const totalPossible = habits.length * totalDays;
  const completed = logs.filter((l) => l.status === true).length;
  const completionRate = totalPossible > 0 ? (completed / totalPossible) * 100 : 0;

  // Calculate per-habit stats
  const habitStats = habits.map((habit) => {
    const habitLogs = logs.filter((l) => l.habit_id === habit.id);
    const habitCompleted = habitLogs.filter((l) => l.status === true).length;
    const habitRate = (habitCompleted / totalDays) * 100;

    return {
      title: habit.title,
      completed: habitCompleted,
      total: totalDays,
      rate: habitRate,
      streak: habit.streak_count,
    };
  });

  // Sort by completion rate
  habitStats.sort((a, b) => b.rate - a.rate);

  return {
    totalCompleted: completed,
    totalPossible,
    completionRate,
    habitStats,
  };
}

function formatReport(user: any, stats: any): string {
  const name = user.name || 'あなた';
  const emoji = getEmoji(stats.completionRate);

  let report = `📊 週間レポート ${emoji}\n\n`;
  report += `こんにちは、${name}さん！\n`;
  report += `今週の習慣の記録をお知らせします。\n\n`;

  report += `【全体の達成率】\n`;
  report += `${stats.totalCompleted}/${stats.totalPossible}回 (${stats.completionRate.toFixed(0)}%)\n\n`;

  report += `【習慣別の実績】\n`;
  for (const habit of stats.habitStats) {
    const bar = generateProgressBar(habit.rate);
    report += `• ${habit.title}\n`;
    report += `  ${bar} ${habit.completed}/${habit.total}回 (${habit.rate.toFixed(0)}%)\n`;
    if (habit.streak > 0) {
      report += `  🔥 ${habit.streak}日連続！\n`;
    }
    report += '\n';
  }

  // Add encouragement based on character type
  report += getEncouragement(user.character_type, stats.completionRate);

  return report;
}

function getEmoji(rate: number): string {
  if (rate >= 80) return '🎉';
  if (rate >= 60) return '💪';
  if (rate >= 40) return '📈';
  return '🌱';
}

function generateProgressBar(rate: number): string {
  const filled = Math.round(rate / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getEncouragement(characterType: string, rate: number): string {
  const high = rate >= 70;
  const medium = rate >= 40;

  const messages = {
    angel: high
      ? '素晴らしい一週間でした！✨ あなたの努力は必ず実を結びます。来週も見守っています。'
      : medium
      ? '頑張っていますね！💫 完璧でなくても大丈夫。続けることが一番大切です。'
      : 'どんな小さな一歩も、前進です🌟 来週は一緒にもう少し頑張りましょう。',
    coach: high
      ? 'よくやった！この調子だ！💪 目標達成に向けて突き進め！'
      : medium
      ? 'まだまだいける！🔥 もっと上を目指そう！あと一歩だ！'
      : '気合が足りないぞ！💢 でも諦めるな！来週は必ずやり遂げろ！',
    friend: high
      ? 'すごいね！🎉 一緒に頑張ってて嬉しいよ！来週も楽しくいこう！'
      : medium
      ? 'いい感じだよ！😊 マイペースで大丈夫。応援してるからね！'
      : 'ちょっと大変だったかな？😅 でも続けてるのが偉い！来週は一緒に頑張ろう！',
    analyst: high
      ? '高い達成率です📊 このパフォーマンスを維持することを推奨します。'
      : medium
      ? '平均的な達成率です📈 改善の余地がありますが、継続できています。'
      : '達成率が低めです📉 習慣の見直しまたは目標の調整を検討してください。',
  };

  return messages[characterType as keyof typeof messages] || messages.friend;
}
