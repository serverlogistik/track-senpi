#!/bin/bash
# Render Build Script for Track Senpi Backend

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Initialize database schema
echo "🗄️ Initializing database schema..."
if [ -n "$DATABASE_URL" ]; then
    # Install PostgreSQL client
    echo "Installing PostgreSQL client..."
    apt-get update && apt-get install -y postgresql-client
    
    # Run schema.sql
    echo "Running schema.sql..."
    psql $DATABASE_URL -f database/schema.sql
    
    echo "✅ Database schema initialized successfully!"
else
    echo "⚠️ DATABASE_URL not set, skipping schema initialization"
fi

echo "✅ Build completed successfully!"
