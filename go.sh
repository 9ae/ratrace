#!/bin/bash

# RatRace Development Environment Startup Script
echo "🏁 Starting RatRace Development Environment..."

# Start Redis server
echo "🔴 Starting Redis server..."
redis-server --daemonize yes

# Wait a moment for Redis to start
sleep 2

# Check if Redis is running
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis server is running"
else
    echo "❌ Failed to start Redis server"
    exit 1
fi

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to open new terminal tab and run command
open_tab_and_run() {
    local dir="$1"
    local command="$2"
    local title="$3"
    
    osascript <<'EOF'
tell application "Visual Studio Code"
    activate
    delay 0.5
    tell application "System Events"
        tell process "Visual Studio Code"
            # Open new terminal with Cmd+Shift+`
            keystroke "`" using {command down, shift down}
            delay 1
        end tell
    end tell
end tell
EOF
    
    # Send the command in a separate osascript call to avoid variable interpolation issues
    osascript -e "
    tell application \"System Events\"
        tell process \"Visual Studio Code\"
            keystroke \"cd '$dir' && echo '🚀 Starting $title...' && $command\"
            delay 0.5
            keystroke return
        end tell
    end tell
    "
}

# Start backend in new tab
echo "🔧 Starting backend server..."
open_tab_and_run "$SCRIPT_DIR/ratrace-backend" "npm run dev" "Backend Server"

# Wait a moment before starting frontend
sleep 3

# Start frontend in new tab
echo "🎨 Starting frontend server..."
open_tab_and_run "$SCRIPT_DIR/ratrace-frontend" "npm run dev" "Frontend Server"

echo "✅ Development environment started!"
echo "📋 Summary:"
echo "   - Redis server: Running in background"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: http://localhost:3000"
echo ""
echo "🛑 To stop all services:"
echo "   - Close terminal tabs for backend/frontend"
echo "   - Stop Redis: redis-cli shutdown"