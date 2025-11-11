// HabitLine Webhook Handler - Main entry point for LINE Messaging API

import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import {
  verifyLINESignature,
  replyMessage,
  getUserProfile,
  createCelebrationMessage,
  createHelpMessage,
} from '../_shared/line.ts';
import type {
  LINEWebhookBody,
  LINEWebhookEvent,
  HabitUser,
  HabitHabit,
  APIResponse,
} from '../_shared/types.ts';

serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get environment variables
    const channelSecret = Deno.env.get('HABIT_LINE_CHANNEL_SECRET');
    const accessToken = Deno.env.get('HABIT_LINE_ACCESS_TOKEN');

    if (!channelSecret || !accessToken) {
      throw new Error('Missing LINE credentials');
    }

    // Verify signature
    const signature = req.headers.get('x-line-signature');
    const body = await req.text();

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifyLINESignature(body, signature, channelSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse webhook body
    const webhookBody: LINEWebhookBody = JSON.parse(body);
    const supabase = getSupabaseClient();

    // Process each event
    for (const event of webhookBody.events) {
      await handleEvent(event, supabase, accessToken);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleEvent(
  event: LINEWebhookEvent,
  supabase: any,
  accessToken: string
) {
  // Only handle user events
  if (event.source.type !== 'user' || !event.source.userId) {
    return;
  }

  const lineUserId = event.source.userId;

  // Get or create user
  const user = await getOrCreateUser(lineUserId, supabase, accessToken);

  // Handle different event types
  if (event.type === 'message' && event.message?.type === 'text') {
    await handleTextMessage(event, user, supabase, accessToken);
  } else if (event.type === 'postback') {
    await handlePostback(event, user, supabase, accessToken);
  } else if (event.type === 'follow') {
    await handleFollow(event, user, supabase, accessToken);
  }
}

async function getOrCreateUser(
  lineUserId: string,
  supabase: any,
  accessToken: string
): Promise<HabitUser> {
  // Check if user exists
  const { data: existingUser, error } = await supabase
    .from('habit_users')
    .select('*')
    .eq('line_id', lineUserId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // Create new user
  const profile = await getUserProfile(lineUserId, accessToken);
  const { data: newUser, error: createError } = await supabase
    .from('habit_users')
    .insert({
      line_id: lineUserId,
      name: profile.displayName,
      plan: 'free',
      character_type: 'angel',
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  return newUser;
}

async function handleTextMessage(
  event: LINEWebhookEvent,
  user: HabitUser,
  supabase: any,
  accessToken: string
) {
  if (!event.message?.text || !event.replyToken) return;

  const text = event.message.text.trim();
  const lower = text.toLowerCase();

  // Command routing
  if (lower === '開始' || lower === 'help' || lower === 'ヘルプ') {
    await replyMessage(event.replyToken, [createHelpMessage()], accessToken);
  } else if (text.startsWith('習慣 追加') || text.startsWith('習慣追加')) {
    await handleAddHabit(text, user, event.replyToken, supabase, accessToken);
  } else if (lower === 'やった' || lower === 'done') {
    await handleComplete(user, event.replyToken, supabase, accessToken);
  } else if (lower === '進捗' || lower === 'progress') {
    await handleProgress(user, event.replyToken, supabase, accessToken);
  } else if (lower === '一覧' || lower === 'list') {
    await handleList(user, event.replyToken, supabase, accessToken);
  } else {
    // Default response
    await replyMessage(
      event.replyToken,
      [
        {
          type: 'text',
          text: 'コマンドが認識できませんでした。\n「help」と入力してヘルプを表示してください。',
        },
      ],
      accessToken
    );
  }
}

async function handleAddHabit(
  text: string,
  user: HabitUser,
  replyToken: string,
  supabase: any,
  accessToken: string
) {
  // Extract habit title
  const match = text.match(/習慣\s*追加\s+(.+)/);
  if (!match || !match[1]) {
    await replyMessage(
      replyToken,
      [
        {
          type: 'text',
          text: '使い方: 習慣 追加 <タイトル>\n例: 習慣 追加 読書10分',
        },
      ],
      accessToken
    );
    return;
  }

  const title = match[1].trim();

  // Create habit
  const { data: habit, error } = await supabase
    .from('habit_habits')
    .insert({
      user_id: user.id,
      title,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    await replyMessage(
      replyToken,
      [{ type: 'text', text: '習慣の登録に失敗しました。もう一度お試しください。' }],
      accessToken
    );
    return;
  }

  await replyMessage(
    replyToken,
    [
      {
        type: 'text',
        text: `✅ 習慣「${title}」を登録しました！\n\nリマインド時刻を設定するには:\nリマインド 07:00\nのように入力してください。`,
      },
    ],
    accessToken
  );
}

async function handleComplete(
  user: HabitUser,
  replyToken: string,
  supabase: any,
  accessToken: string
) {
  // Get active habits
  const { data: habits, error } = await supabase
    .from('habit_habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error || !habits || habits.length === 0) {
    await replyMessage(
      replyToken,
      [{ type: 'text', text: 'まだ習慣が登録されていません。\n「習慣 追加 <タイトル>」で登録してください。' }],
      accessToken
    );
    return;
  }

  // For simplicity, mark the first habit as complete
  const habit: HabitHabit = habits[0];
  const today = new Date().toISOString().split('T')[0];

  // Upsert log
  const { error: logError } = await supabase
    .from('habit_logs')
    .upsert(
      {
        habit_id: habit.id,
        date: today,
        status: true,
      },
      { onConflict: 'habit_id,date' }
    );

  if (logError) {
    await replyMessage(
      replyToken,
      [{ type: 'text', text: '記録に失敗しました。もう一度お試しください。' }],
      accessToken
    );
    return;
  }

  // Get updated habit for streak count
  const { data: updatedHabit } = await supabase
    .from('habit_habits')
    .select('streak_count')
    .eq('id', habit.id)
    .single();

  const streakCount = updatedHabit?.streak_count || 1;

  await replyMessage(
    replyToken,
    [createCelebrationMessage(habit.title, streakCount, user.character_type)],
    accessToken
  );
}

async function handleProgress(
  user: HabitUser,
  replyToken: string,
  supabase: any,
  accessToken: string
) {
  const { data: habits } = await supabase
    .from('habit_habits')
    .select('title, streak_count, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!habits || habits.length === 0) {
    await replyMessage(
      replyToken,
      [{ type: 'text', text: 'まだ習慣が登録されていません。' }],
      accessToken
    );
    return;
  }

  let message = '📊 あなたの進捗\n\n';
  for (const habit of habits) {
    message += `• ${habit.title}: ${habit.streak_count}日連続\n`;
  }

  await replyMessage(replyToken, [{ type: 'text', text: message }], accessToken);
}

async function handleList(
  user: HabitUser,
  replyToken: string,
  supabase: any,
  accessToken: string
) {
  const { data: habits } = await supabase
    .from('habit_habits')
    .select('title, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!habits || habits.length === 0) {
    await replyMessage(
      replyToken,
      [{ type: 'text', text: 'まだ習慣が登録されていません。' }],
      accessToken
    );
    return;
  }

  let message = '📝 登録中の習慣\n\n';
  for (const habit of habits) {
    const status = habit.is_active ? '✅' : '⏸️';
    message += `${status} ${habit.title}\n`;
  }

  await replyMessage(replyToken, [{ type: 'text', text: message }], accessToken);
}

async function handlePostback(
  event: LINEWebhookEvent,
  user: HabitUser,
  supabase: any,
  accessToken: string
) {
  if (!event.postback?.data || !event.replyToken) return;

  const params = new URLSearchParams(event.postback.data);
  const action = params.get('action');
  const habitId = params.get('habit_id');

  if (!action || !habitId) return;

  if (action === 'done') {
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('habit_logs').upsert(
      {
        habit_id: habitId,
        date: today,
        status: true,
      },
      { onConflict: 'habit_id,date' }
    );

    const { data: habit } = await supabase
      .from('habit_habits')
      .select('title, streak_count')
      .eq('id', habitId)
      .single();

    if (habit) {
      await replyMessage(
        event.replyToken,
        [createCelebrationMessage(habit.title, habit.streak_count, user.character_type)],
        accessToken
      );
    }
  } else if (action === 'later') {
    await replyMessage(
      event.replyToken,
      [{ type: 'text', text: 'わかりました！また後でリマインドします。' }],
      accessToken
    );
  }
}

async function handleFollow(
  event: LINEWebhookEvent,
  user: HabitUser,
  supabase: any,
  accessToken: string
) {
  if (!event.replyToken) return;

  await replyMessage(
    event.replyToken,
    [
      {
        type: 'text',
        text: `ようこそHabitLineへ！✨\n\n続ける力を、設計で支える。\n毎日の小さな習慣を一緒に育てていきましょう。\n\n「help」と入力すると使い方が表示されます。`,
      },
    ],
    accessToken
  );
}
