#!/bin/bash

# Database Setup Script for Neon PostgreSQL
# Generates migrations and seeds database with initial data

echo "🗄️  Drosera Oracle Trap - Database Setup"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set"
  echo ""
  echo "Please set your Neon PostgreSQL connection string:"
  echo "  export DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'"
  echo ""
  echo "Get your connection string from: https://console.neon.tech"
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Step 1: Generate migrations from schema
echo "📦 Step 1: Generating migrations from Drizzle schema..."
npx drizzle-kit generate

if [ $? -ne 0 ]; then
  echo "❌ Migration generation failed"
  exit 1
fi

echo "✅ Migrations generated in ./drizzle directory"
echo ""

# Step 2: Run migrations
echo "🚀 Step 2: Applying migrations to database..."
tsx scripts/migrate-database.ts

if [ $? -ne 0 ]; then
  echo "❌ Migration failed"
  exit 1
fi

echo ""

# Step 3: Seed database
echo "🌱 Step 3: Seeding database with initial configuration..."
read -p "Do you want to seed the database? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  tsx scripts/seed-database.ts
  
  if [ $? -ne 0 ]; then
    echo "❌ Seeding failed"
    exit 1
  fi
else
  echo "⏭️  Skipping database seeding"
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Add DATABASE_URL to Vercel environment variables"
echo "  2. Deploy to Vercel: vercel --prod"
echo "  3. Monitor database: https://console.neon.tech"
echo ""
