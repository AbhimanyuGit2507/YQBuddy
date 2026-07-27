#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/startup-$(date +%Y%m%d-%H%M%S).log"
BACKEND_PID=""
FRONTEND_PID=""

mkdir -p "$LOG_DIR"
> "$LOG_FILE"

log() {
    local level="$1"
    shift
    echo "[$(date '+%H:%M:%S')] [$level] $*" >> "$LOG_FILE"
}

info() { log "INFO" "$*"; echo -e "\033[0;34mℹ\033[0m $*"; }
success() { log "OK" "$*"; echo -e "\033[0;32m✔\033[0m $*"; }
warn() { log "WARN" "$*"; echo -e "\033[1;33m⚠\033[0m $*"; }
error() { log "ERROR" "$*"; echo -e "\033[0;31m✖\033[0m $*" >&2; }
fatal() { log "FATAL" "$*"; echo -e "\033[0;31m✖ FATAL: $*\033[0m" >&2; cleanup; exit 1; }

cleanup() {
    [ ! -z "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ ! -z "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    docker compose down 2>/dev/null || true
    success "Stopped"
}

trap cleanup SIGINT SIGTERM EXIT

check_cmd() { command -v "$1" &>/dev/null || fatal "'$1' not found"; }

wait_http() {
    local name="$1" url="$2" timeout="${3:-20}" start=$(date +%s)
    while true; do
        curl -sf -o /dev/null "$url" 2>/dev/null && { success "$name ready"; return; }
        [ $(( $(date +%s) - start )) -ge $timeout ] && { warn "$name timeout (${timeout}s)"; return; }
        sleep 1
    done
}

main() {
    info "Starting YQ Queue..."
    log "START" "Log: $LOG_FILE"

    check_cmd docker; check_cmd npm; check_cmd node
    docker info &>/dev/null || fatal "Docker not running"

    info "Starting Docker..."
    docker compose up -d >> "$LOG_FILE" 2>&1
    sleep 5

    info "Setting up backend..."
    cd "$PROJECT_ROOT/backend"
    npm install --silent >> "$LOG_FILE" 2>&1
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="local dev" npx prisma db push >> "$LOG_FILE" 2>&1
    npx prisma generate >> "$LOG_FILE" 2>&1
    npm run build >> "$LOG_FILE" 2>&1

    info "Starting backend..."
    npm run start:dev >> "$LOG_FILE" 2>&1 &
    BACKEND_PID=$!
    success "Backend PID $BACKEND_PID"
    wait_http "Backend" "http://localhost:3000/health" 30

    info "Setting up frontend..."
    cd "$PROJECT_ROOT/frontend"
    npm install --silent --legacy-peer-deps >> "$LOG_FILE" 2>&1
    npm run build >> "$LOG_FILE" 2>&1

    info "Starting frontend..."
    npm run dev -- -p 3001 >> "$LOG_FILE" 2>&1 &
    FRONTEND_PID=$!
    success "Frontend PID $FRONTEND_PID"
    wait_http "Frontend" "http://localhost:3001" 30

    echo ""
    success "All services running"
    echo -e "  Frontend:  \033[1mhttp://localhost:3001\033[0m"
    echo -e "  Backend:   \033[1mhttp://localhost:3000\033[0m"
    echo -e "  Evolution: \033[1mhttp://localhost:8080\033[0m"
    echo -e "  Logs:      \033[0;90m$LOG_FILE\033[0m"
    log "READY" "All services started"

    wait
}

main "$@"
