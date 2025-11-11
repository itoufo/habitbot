#!/bin/bash

# HabitLine Secrets Setup Script
# Helper script to set all required environment variables

set -e

echo "🔐 HabitLine Secrets Setup"
echo "This script will help you set up all required environment variables."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env first:"
    echo "   cp .env.example .env"
    exit 1
fi

# Source .env file
source .env

echo "Setting Supabase secrets..."

# LINE
if [ -n "$HABIT_LINE_CHANNEL_SECRET" ]; then
    echo "  → HABIT_LINE_CHANNEL_SECRET"
    supabase secrets set HABIT_LINE_CHANNEL_SECRET="$HABIT_LINE_CHANNEL_SECRET"
fi

if [ -n "$HABIT_LINE_ACCESS_TOKEN" ]; then
    echo "  → HABIT_LINE_ACCESS_TOKEN"
    supabase secrets set HABIT_LINE_ACCESS_TOKEN="$HABIT_LINE_ACCESS_TOKEN"
fi

# OpenAI
if [ -n "$HABIT_OPENAI_API_KEY" ]; then
    echo "  → HABIT_OPENAI_API_KEY"
    supabase secrets set HABIT_OPENAI_API_KEY="$HABIT_OPENAI_API_KEY"
fi

# Supabase
if [ -n "$HABIT_SUPABASE_URL" ]; then
    echo "  → HABIT_SUPABASE_URL"
    supabase secrets set HABIT_SUPABASE_URL="$HABIT_SUPABASE_URL"
fi

if [ -n "$HABIT_SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "  → HABIT_SUPABASE_SERVICE_ROLE_KEY"
    supabase secrets set HABIT_SUPABASE_SERVICE_ROLE_KEY="$HABIT_SUPABASE_SERVICE_ROLE_KEY"
fi

# Stripe (optional)
if [ -n "$HABIT_STRIPE_WEBHOOK_SECRET" ]; then
    echo "  → HABIT_STRIPE_WEBHOOK_SECRET"
    supabase secrets set HABIT_STRIPE_WEBHOOK_SECRET="$HABIT_STRIPE_WEBHOOK_SECRET"
fi

echo ""
echo "✅ Secrets setup complete!"
echo ""
echo "To verify, run:"
echo "  supabase secrets list"
