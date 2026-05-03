#!/bin/bash

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ">>> Starting CYBERSECPRO Backend..."
node "$ROOT/server/index.js" &
BACKEND_PID=$!

sleep 1
echo ">>> Starting CYBERSECPRO Frontend..."
cd "$ROOT/client" && npx vite --port 5000 --host 0.0.0.0

wait $BACKEND_PID
