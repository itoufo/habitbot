// HabitLine AI Feedback Analyzer - Generate personalized AI feedback

import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { pushMessage } from '../_shared/line.ts';
import type { HabitUser, AIPromptContext, APIResponse } from '../_shared/types.ts';

serve(async (req: Request) => {
  try {
    const openaiApiKey = Deno.env.get('HABIT_OPENAI_API_KEY');
    const lineAccessToken = Deno.env.get('HABIT_LINE_CHANNEL_ACCESS_TOKEN');

    if (!openaiApiKey || !lineAccessToken) {
      throw new Error('Missing required environment variables');
    }

    const supabase = getSupabaseClient();

    // Get target date (default: today)
    const url = new URL(req.url);
    const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    console.log(`Analyzing feedback for date: ${targetDate}`);

    // Get all users who had activity today
    const { data: logs, error } = await supabase
      .from('habit_logs')
      .select(
        `
        id,
        status,
        note,
        habit_id,
        habit_habits!inner (
          title,
          streak_count,
          user_id,
          habit_users!inner (
            id,
            line_id,
            name,
            character_type
          )
        )
      `
      )
      .eq('date', targetDate);

    if (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }

    if (!logs || logs.length === 0) {
      console.log('No activity to analyze for this date');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No activity to analyze',
          count: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Group logs by user
    const userLogs = new Map<string, any[]>();
    for (const log of logs) {
      const userId = log.habit_habits.user_id;
      if (!userLogs.has(userId)) {
        userLogs.set(userId, []);
      }
      userLogs.get(userId)!.push(log);
    }

    console.log(`Generating feedback for ${userLogs.size} users`);

    // Generate feedback for each user
    const results = await Promise.allSettled(
      Array.from(userLogs.entries()).map(async ([userId, userLogsData]) => {
        const user = userLogsData[0].habit_habits.habit_users;
        const completed = userLogsData.filter((l) => l.status === true).length;
        const total = userLogsData.length;

        // Build context
        const context: AIPromptContext = {
          user_name: user.name || 'あなた',
          character_type: user.character_type,
          habits_completed: completed,
          habits_total: total,
          streak_info: userLogsData
            .filter((l) => l.status === true)
            .map((l) => ({
              title: l.habit_habits.title,
              streak: l.habit_habits.streak_count,
            })),
          notes: userLogsData.filter((l) => l.note).map((l) => l.note),
        };

        // Generate AI feedback
        const feedback = await generateAIFeedback(context, openaiApiKey);

        // Save feedback to database
        await supabase.from('habit_ai_feedback').insert({
          user_id: userId,
          message: feedback.message,
          sentiment: feedback.sentiment,
          feedback_date: targetDate,
        });

        // Send to LINE (optional, based on user preference)
        try {
          await pushMessage(
            user.line_id,
            [{ type: 'text', text: `📊 今日のふりかえり\n\n${feedback.message}` }],
            lineAccessToken
          );
          console.log(`Sent feedback to user ${userId}`);
        } catch (error) {
          console.error(`Failed to send feedback to user ${userId}:`, error);
          // Don't throw, feedback is saved in DB
        }

        return { userId, success: true };
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Feedback generation complete: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated feedback for ${successful} users, ${failed} failed`,
        total: userLogs.size,
        successful,
        failed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in habit_analyze_feedback:', error);
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

async function generateAIFeedback(
  context: AIPromptContext,
  apiKey: string
): Promise<{ message: string; sentiment: number }> {
  const characterPrompts = {
    angel: '天使のように優しく、温かく励ましてください。',
    coach: '熱血コーチのように力強く、時に厳しく激励してください。',
    friend: '親友のようにフレンドリーで、共感的に応援してください。',
    analyst: '冷静なアナリストのように客観的で、データに基づいた分析を提供してください。',
  };

  const systemPrompt = `あなたはポジティブで論理的な習慣コーチです。
${characterPrompts[context.character_type]}

ユーザーの今日の習慣記録を分析し、120〜200文字で以下を含むフィードバックを生成してください:
1. 今日の良い点を具体的に称賛
2. 明日のための1つの超具体的なアクションを提案
3. 最後に短い励まし(絵文字1つ)

必ず日本語で回答してください。`;

  const userPrompt = `【今日の記録】
- 達成: ${context.habits_completed}/${context.habits_total}習慣
- 連続記録: ${context.streak_info.map((s) => `${s.title}(${s.streak}日)`).join(', ')}
${context.notes && context.notes.length > 0 ? `- メモ: ${context.notes.join(', ')}` : ''}

フィードバックをお願いします。`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices[0].message.content.trim();

    // Calculate sentiment (simple heuristic based on completion rate)
    const completionRate = context.habits_completed / context.habits_total;
    const sentiment = completionRate >= 0.8 ? 0.8 : completionRate >= 0.5 ? 0.5 : 0.2;

    return { message, sentiment };
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    // Fallback message
    const fallbackMessages = {
      angel: `今日も頑張りましたね！✨ ${context.habits_completed}つの習慣を達成できました。明日も一緒に続けていきましょう。`,
      coach: `よくやった！${context.habits_completed}習慣クリアだ💪 明日はもっと上を目指そう！`,
      friend: `お疲れさま！今日は${context.habits_completed}個できたね🎉 明日も一緒に頑張ろう！`,
      analyst: `本日の達成率: ${((context.habits_completed / context.habits_total) * 100).toFixed(0)}%。統計的に良好です📊`,
    };

    return {
      message: fallbackMessages[context.character_type],
      sentiment: 0.5,
    };
  }
}
