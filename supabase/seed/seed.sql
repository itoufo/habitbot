-- HabitLine Test Seed Data
-- This file creates sample data for development and testing

-- Clean existing data (be careful in production!)
TRUNCATE habit_users, habit_habits, habit_logs, habit_ai_feedback, habit_schedules CASCADE;

-- Insert test users
INSERT INTO habit_users (id, line_id, name, plan, character_type, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'U1234567890abcdef', '田中太郎', 'free', 'angel', NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000000002', 'U2234567890abcdef', '佐藤花子', 'standard', 'coach', NOW() - INTERVAL '20 days'),
  ('00000000-0000-0000-0000-000000000003', 'U3234567890abcdef', '鈴木一郎', 'premium', 'friend', NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0000-000000000004', 'U4234567890abcdef', '山田美咲', 'free', 'analyst', NOW() - INTERVAL '5 days');

-- Insert test habits
INSERT INTO habit_habits (id, user_id, title, reminder_time, is_active, streak_count, last_completed_date, created_at) VALUES
  -- User 1 habits
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '読書10分', '07:00:00', true, 15, CURRENT_DATE, NOW() - INTERVAL '30 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ジョギング', '06:00:00', true, 8, CURRENT_DATE, NOW() - INTERVAL '25 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '英語学習', '22:00:00', true, 3, CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '20 days'),

  -- User 2 habits
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '筋トレ', '18:00:00', true, 20, CURRENT_DATE, NOW() - INTERVAL '20 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '瞑想5分', '07:30:00', true, 12, CURRENT_DATE, NOW() - INTERVAL '15 days'),

  -- User 3 habits
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'SNS投稿', '20:00:00', true, 5, CURRENT_DATE, NOW() - INTERVAL '10 days'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', '水2L飲む', '09:00:00', true, 7, CURRENT_DATE, NOW() - INTERVAL '8 days'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', '日記を書く', '23:00:00', false, 0, NULL, NOW() - INTERVAL '5 days'),

  -- User 4 habits
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'プログラミング1時間', '21:00:00', true, 2, CURRENT_DATE, NOW() - INTERVAL '5 days');

-- Insert test logs (last 7 days)
DO $$
DECLARE
  habit_record RECORD;
  day_offset INT;
  should_complete BOOLEAN;
BEGIN
  FOR habit_record IN
    SELECT id, user_id, streak_count FROM habit_habits WHERE is_active = true
  LOOP
    FOR day_offset IN 0..6 LOOP
      -- Simulate realistic completion patterns (higher streak = more consistent)
      should_complete := (random() * 100) < (50 + habit_record.streak_count * 2);

      IF should_complete THEN
        INSERT INTO habit_logs (habit_id, date, status, created_at) VALUES
          (habit_record.id, CURRENT_DATE - day_offset, true, NOW() - (day_offset || ' days')::INTERVAL);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Insert some logs with notes
UPDATE habit_logs SET note = '調子良い！' WHERE habit_id = '10000000-0000-0000-0000-000000000001' AND date = CURRENT_DATE;
UPDATE habit_logs SET note = '少し疲れたけど完了' WHERE habit_id = '10000000-0000-0000-0000-000000000004' AND date = CURRENT_DATE - INTERVAL '1 day';
UPDATE habit_logs SET note = 'モチベーション高い' WHERE habit_id = '10000000-0000-0000-0000-000000000006' AND date = CURRENT_DATE;

-- Insert AI feedback samples
INSERT INTO habit_ai_feedback (user_id, message, sentiment, feedback_date, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001',
   '素晴らしい！✨ 今日は3つの習慣を達成しました。特に読書が15日連続です。明日も朝起きてすぐに読書をすると、より確実に続けられます。',
   0.85, CURRENT_DATE, NOW()),

  ('00000000-0000-0000-0000-000000000002',
   'よくやった！💪 筋トレ20日連続だ！この調子で続けろ！瞑想も素晴らしいぞ。明日は少し強度を上げてみるのもいいかもしれない。',
   0.9, CURRENT_DATE, NOW()),

  ('00000000-0000-0000-0000-000000000003',
   'やったね！🎉 今日も2つ完了！SNS投稿と水分補給、どちらも大切だよ。明日は日記も書いてみたらどうかな？',
   0.75, CURRENT_DATE, NOW()),

  ('00000000-0000-0000-0000-000000000001',
   '今日の良い点: 読書と英語学習を達成しました✨ 連続記録を意識できています。明日の提案: ジョギングも朝の読書と一緒に行うと、ルーティン化しやすくなります。',
   0.8, CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert custom schedules
INSERT INTO habit_schedules (habit_id, notify_time, days, is_active, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', '07:00:00', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], true, NOW()),
  ('10000000-0000-0000-0000-000000000002', '06:00:00', ARRAY['Mon','Wed','Fri'], true, NOW()),
  ('10000000-0000-0000-0000-000000000004', '18:00:00', ARRAY['Mon','Tue','Wed','Thu','Fri'], true, NOW()),
  ('10000000-0000-0000-0000-000000000005', '07:30:00', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], true, NOW());

-- Insert a sample team (for B2B testing)
INSERT INTO habit_teams (id, name, owner_user_id, created_at) VALUES
  ('20000000-0000-0000-0000-000000000001', 'スタートアップ株式会社', '00000000-0000-0000-0000-000000000002', NOW());

-- Insert team members
INSERT INTO habit_team_members (team_id, user_id, role, created_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'owner', NOW()),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'admin', NOW()),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'member', NOW());

-- Display summary
DO $$
DECLARE
  user_count INT;
  habit_count INT;
  log_count INT;
  feedback_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM habit_users;
  SELECT COUNT(*) INTO habit_count FROM habit_habits;
  SELECT COUNT(*) INTO log_count FROM habit_logs;
  SELECT COUNT(*) INTO feedback_count FROM habit_ai_feedback;

  RAISE NOTICE '=== Seed Data Summary ===';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Habits: %', habit_count;
  RAISE NOTICE 'Logs: %', log_count;
  RAISE NOTICE 'AI Feedbacks: %', feedback_count;
  RAISE NOTICE '========================';
END $$;
