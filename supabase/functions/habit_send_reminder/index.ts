// HabitLine Reminder Sender - Send scheduled reminders to users

import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { pushMessage, createReminderFlexMessage } from '../_shared/line.ts';
import type { HabitHabit, HabitUser, APIResponse } from '../_shared/types.ts';

serve(async (req: Request) => {
  try {
    const accessToken = Deno.env.get('HABIT_LINE_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Missing HABIT_LINE_ACCESS_TOKEN');
    }

    const supabase = getSupabaseClient();

    // Get current time in HH:MM format
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:00`;

    console.log(`Checking reminders for time: ${currentTime}`);

    // Get all active habits with matching reminder_time
    const { data: habits, error } = await supabase
      .from('habit_habits')
      .select(
        `
        id,
        title,
        user_id,
        reminder_time,
        habit_users!inner (
          id,
          line_id,
          character_type
        )
      `
      )
      .eq('is_active', true)
      .eq('reminder_time', currentTime);

    if (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }

    if (!habits || habits.length === 0) {
      console.log('No reminders to send at this time');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No reminders to send',
          count: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${habits.length} reminders to send`);

    // Send reminders
    const results = await Promise.allSettled(
      habits.map(async (habit: any) => {
        try {
          const user = habit.habit_users;
          const message = createReminderFlexMessage(habit.title, habit.id);

          const response = await pushMessage(user.line_id, [message], accessToken);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LINE API error: ${response.status} - ${errorText}`);
          }

          console.log(`Sent reminder for habit ${habit.id} to user ${user.line_id}`);
          return { habitId: habit.id, userId: user.id, success: true };
        } catch (error) {
          console.error(`Failed to send reminder for habit ${habit.id}:`, error);

          // Add to retry queue
          await supabase.from('habit_retry_queue').insert({
            operation_type: 'send_reminder',
            payload: {
              habit_id: habit.id,
              user_id: habit.user_id,
              title: habit.title,
            },
            retry_count: 0,
            max_retries: 3,
            next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 minutes
            error_message: error.message,
          });

          throw error;
        }
      })
    );

    // Count successes and failures
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Reminder batch complete: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successful} reminders, ${failed} failed`,
        total: habits.length,
        successful,
        failed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in habit_send_reminder:', error);
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
