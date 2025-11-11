#!/bin/bash

# Netlify Build Script for HabitLine Admin

set -e

echo "🚀 Starting HabitLine Admin build for Netlify..."

# Navigate to admin directory
cd admin

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build Next.js app
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"

# Display build info
echo ""
echo "📊 Build Information:"
echo "   Directory: admin/"
echo "   Output: admin/.next/"
echo ""
