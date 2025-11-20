#!/usr/bin/env bash
# Ensure required dev ports are free before starting Next.js dev server.
set -euo pipefail

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

log() {
    echo "$1"
}

kill_port_processes() {
    local port=$1

    if command_exists lsof; then
        local pids
        pids=$(lsof -ti:"$port" 2>/dev/null || true)
        if [[ -n "$pids" ]]; then
            log "Found process(es) using port $port, killing them..."
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
    else
        log "lsof command not found, skipping port cleanup for $port"
    fi
}

log "Checking for processes on development ports..."

kill_port_processes 3000
kill_port_processes 5173

log "Starting development server..."
exec pnpm exec next dev
