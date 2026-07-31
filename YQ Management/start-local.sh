#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/log.txt"
FAIL_MODE=0

mkdir -p "$SCRIPT_DIR/logs"
> "$LOG_FILE"

echo "=========================================="
echo "🚀 Starting YQ Queue Local Environment 🚀"
echo "=========================================="

log() {
    echo "$1" | tee -a "$LOG_FILE"
}

cleanup() {
    echo "" | tee -a "$LOG_FILE"
    log "🛑 Stopping services..."
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null
        wait $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null
        wait $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$DOCKER_LOGS_PID" ] && kill -0 $DOCKER_LOGS_PID 2>/dev/null; then
        kill $DOCKER_LOGS_PID 2>/dev/null
        wait $DOCKER_LOGS_PID 2>/dev/null || true
    fi
    log "🛑 Stopping Docker containers..."
    docker compose stop >> "$LOG_FILE" 2>&1
    log "✅ All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

log "📋 Log file: $LOG_FILE"

# 1. Start Docker Services
log "📦 Starting PostgreSQL and Redis via Docker Compose..."
docker compose up -d >> "$LOG_FILE" 2>&1

# Wait for database to be ready
log "⏳ Waiting for database to initialize..."
sleep 5

# Verify PostgreSQL is ready
log "🔍 Checking PostgreSQL connection..."
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        log "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log "❌ PostgreSQL failed to start"
        exit 1
    fi
    sleep 1
done

# Verify Redis is ready
log "🔍 Checking Redis connection..."
for i in {1..30}; do
    if docker compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        log "✅ Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log "❌ Redis failed to start"
        exit 1
    fi
    sleep 1
done

# 2. Setup & Start Backend
log "⚙️ Setting up backend..."
cd backend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log "📦 Installing backend dependencies..."
    npm install >> "$LOG_FILE" 2>&1
fi

# Ensure Prisma is synced and generated
log "🔄 Syncing Prisma schema..."
npx prisma db push --accept-data-loss >> "$LOG_FILE" 2>&1
npx prisma generate >> "$LOG_FILE" 2>&1

# Build backend
log "🔨 Building backend..."
if ! npm run build >> "$LOG_FILE" 2>&1; then
    log "❌ Backend build failed. Check logs for details."
    log "Last 20 lines of log:"
    tail -20 "$LOG_FILE" | tee -a "$LOG_FILE"
    FAIL_MODE=1
fi

if [ "$FAIL_MODE" -eq 1 ]; then
    log "🛑 Stopping services..."
    docker compose stop >> "$LOG_FILE" 2>&1
    exit 1
fi

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log "⚠️  Port 3000 is already in use. Killing existing process..."
    PIDS=$(lsof -ti :3000)
    if [ -n "$PIDS" ]; then
        kill -9 $PIDS 2>/dev/null || true
        sleep 5
    fi
    # Double check
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log "❌ Port 3000 still in use. Please manually stop the process."
        exit 1
    fi
fi

log "🟢 Starting NestJS Backend Server..."
env NODE_ENV=development node dist/src/main >> "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

# Wait a moment for the process to start
sleep 3

# Verify the process is actually running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    log "❌ Backend process died immediately"
    log "Last 20 lines of backend log:"
    tail -20 "$LOG_FILE" 2>/dev/null || true
    exit 1
fi

log "✅ Backend started (PID: $BACKEND_PID)"

cd ..

# 3. Setup & Start Frontend
log "🎨 Setting up frontend..."
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log "📦 Installing frontend dependencies..."
    npm install >> "$LOG_FILE" 2>&1
fi

# Check if port 3001 is already in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log "⚠️  Port 3001 is already in use. Killing existing process..."
    PIDS=$(lsof -ti :3001)
    if [ -n "$PIDS" ]; then
        kill -9 $PIDS 2>/dev/null || true
        sleep 5
    fi
    # Double check
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log "❌ Port 3001 still in use. Please manually stop the process."
        exit 1
    fi
fi

log "🟢 Starting Next.js Frontend Server..."

# Start frontend in background and capture PID
npm run dev >> "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!

# Wait a moment for the process to start
sleep 3

# Verify the process is actually running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    log "❌ Frontend process died immediately"
    log "Last 20 lines of frontend log:"
    tail -20 "$LOG_FILE" 2>/dev/null || true
    exit 1
fi

log "✅ Frontend started (PID: $FRONTEND_PID)"

cd ..

# 4. Wait for services to be ready
log ""
log "⏳ Waiting for services to be ready..."

# Wait for backend
log "🔍 Checking backend health..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:3000/health 2>/dev/null | grep -q "200"; then
        log "✅ Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log "⚠️  Backend health check timeout (but process is running)"
    fi
    sleep 1
done

# Wait for frontend
log "🔍 Checking frontend..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:3001/ 2>/dev/null | grep -q "200"; then
        log "✅ Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log "⚠️  Frontend health check timeout (but process is running)"
    fi
    sleep 1
done

log ""
log "=========================================="
log "✨ YQ Queue is now running locally! ✨"
log "=========================================="
log "🔗 Frontend: http://localhost:3001"
log "🔗 Backend API: http://localhost:3000"
log "🔗 Health: http://localhost:3000/health"
log "📋 Logs: $LOG_FILE"
log "👉 Press Ctrl+C at any time to gracefully stop all services."
log "=========================================="

# Stream docker logs to log file in background
(
  docker compose logs -f --no-color >> "$LOG_FILE" 2>&1
) &
DOCKER_LOGS_PID=$!

# Wait indefinitely so the script doesn't exit, keeping trap active
wait
