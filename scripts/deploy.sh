#!/bin/bash

# HabitLine Deployment Script
# Deploys all Edge Functions and runs migrations

set -e

echo "🚀 Starting HabitLine deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

# Deploy migrations
echo "📦 Deploying database migrations..."
supabase db push

# Deploy Edge Functions
echo "⚡ Deploying Edge Functions..."

echo "  → habit_handle_webhook"
supabase functions deploy habit_handle_webhook --no-verify-jwt

echo "  → habit_send_reminder"
supabase functions deploy habit_send_reminder --no-verify-jwt

echo "  → habit_analyze_feedback"
supabase functions deploy habit_analyze_feedback --no-verify-jwt

echo "  → habit_generate_report"
supabase functions deploy habit_generate_report --no-verify-jwt

echo "  → habit_upgrade_plan"
supabase functions deploy habit_upgrade_plan --no-verify-jwt

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables with: supabase secrets set KEY=value"
echo "2. Configure LINE Webhook URL in LINE Developers console"
echo "3. Set up cron jobs in Supabase Dashboard"
echo ""
echo "📚 See README.md for detailed setup instructions"
