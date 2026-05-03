#!/bin/bash
# Start backend in background
cd server && node index.js &
# Start frontend
cd client && npm run dev
