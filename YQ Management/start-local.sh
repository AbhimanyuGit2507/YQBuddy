#!/bin/bash

echo "=========================================="
echo "🚀 Starting YQ Queue Local Environment 🚀"
echo "=========================================="

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    # Kill the background node processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "🛑 Stopping Docker containers..."
    docker compose stop
    echo "✅ All services stopped."
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM to run cleanup
trap cleanup SIGINT SIGTERM

# 1. Start Docker Services
echo "📦 Starting PostgreSQL and Redis via Docker Compose..."
docker compose up -d

# Wait a few seconds for DB to be ready
echo "⏳ Waiting for database to initialize..."
sleep 3

# 2. Setup & Start Backend
echo "⚙️ Setting up backend..."
cd backend
npm install
# Ensure Prisma is synced and generated
npx prisma db push --accept-data-loss
npx prisma generate

echo "🟢 Starting NestJS Backend Server..."
npm run start:dev &
BACKEND_PID=$!
cd ..

# 3. Setup & Start Frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install

echo "🟢 Starting Next.js Frontend Server..."
npm run dev -- -p 3001 &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✨ YQ Queue is now running locally! ✨"
echo "=========================================="
echo "🔗 Frontend: http://localhost:3001 (or 3000 if backend is on another port)"
echo "🔗 Backend API: http://localhost:3000"
echo "👉 Press Ctrl+C at any time to gracefully stop all services."
echo "=========================================="

# Wait indefinitely so the script doesn't exit, keeping trap active
wait
