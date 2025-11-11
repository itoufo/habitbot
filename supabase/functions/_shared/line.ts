// LINE Messaging API utilities

import * as crypto from 'https://deno.land/std@0.210.0/crypto/mod.ts';
import { encodeHex } from 'https://deno.land/std@0.210.0/encoding/hex.ts';
import type { LINEMessage } from './types.ts';

const LINE_MESSAGING_API_BASE = 'https://api.line.me/v2/bot';

/**
 * Verify LINE webhook signature
 */
export async function verifyLINESignature(
  body: string,
  signature: string,
  channelSecret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );

  const calculatedSignature = encodeHex(signatureBuffer);
  return calculatedSignature === signature;
}

/**
 * Send reply message to LINE user
 */
export async function replyMessage(
  replyToken: string,
  messages: LINEMessage[],
  accessToken: string
): Promise<Response> {
  const response = await fetch(`${LINE_MESSAGING_API_BASE}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  return response;
}

/**
 * Send push message to LINE user
 */
export async function pushMessage(
  userId: string,
  messages: LINEMessage[],
  accessToken: string
): Promise<Response> {
  const response = await fetch(`${LINE_MESSAGING_API_BASE}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages,
    }),
  });

  return response;
}

/**
 * Get LINE user profile
 */
export async function getUserProfile(
  userId: string,
  accessToken: string
): Promise<{ displayName: string; userId: string; pictureUrl?: string }> {
  const response = await fetch(`${LINE_MESSAGING_API_BASE}/profile/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user profile: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create reminder Flex Message
 */
export function createReminderFlexMessage(
  habitTitle: string,
  habitId: string
): LINEMessage {
  return {
    type: 'flex',
    altText: `⏰ 習慣リマインド: ${habitTitle}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '⏰ いまの習慣タイム!',
            weight: 'bold',
            size: 'lg',
            color: '#1DB446',
          },
          {
            type: 'text',
            text: habitTitle,
            margin: 'md',
            size: 'xl',
            weight: 'bold',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: 'やった',
              data: `action=done&habit_id=${habitId}`,
              displayText: 'やった',
            },
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: 'あとで',
              data: `action=later&habit_id=${habitId}`,
              displayText: 'あとで',
            },
          },
        ],
      },
    },
  };
}

/**
 * Create celebration message
 */
export function createCelebrationMessage(
  habitTitle: string,
  streakCount: number,
  characterType: 'angel' | 'coach' | 'friend' | 'analyst'
): LINEMessage {
  const messages = {
    angel: `素晴らしい！✨ ${habitTitle}を達成しました！\n連続${streakCount}日です。天使があなたを見守っています。`,
    coach: `よくやった！💪 ${habitTitle}クリア！\n${streakCount}日連続だ。この調子で続けろ！`,
    friend: `やったね！🎉 ${habitTitle}完了！\n${streakCount}日連続、すごいよ！`,
    analyst: `記録完了。${habitTitle}の実行を確認。\n現在の連続記録: ${streakCount}日。統計的に良好です。`,
  };

  return {
    type: 'text',
    text: messages[characterType],
  };
}

/**
 * Create help message
 */
export function createHelpMessage(): LINEMessage {
  return {
    type: 'text',
    text: `📖 HabitLine ヘルプ

【コマンド】
• 開始 / help - このメッセージを表示
• 習慣 追加 <タイトル> - 新しい習慣を登録
• リマインド <HH:MM> - 通知時刻を設定
• やった - 今日の習慣を達成
• あとで - 後で実行
• 進捗 - 連続日数と達成率を表示
• 一覧 - 登録中の習慣を表示

【使い方】
1. 「習慣 追加 読書10分」で習慣を登録
2. 「リマインド 07:00」で通知時刻を設定
3. 毎日通知が届いたら「やった」ボタンをタップ
4. 連続日数を伸ばして習慣を定着させよう！

続ける力を、設計で支える。`,
  };
}
