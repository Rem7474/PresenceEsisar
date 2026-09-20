#!/bin/bash

echo "🚀 Starting Presence Esisar..."
echo ""

# Check if frontend is built
if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend not built. Run 'npm run build' in frontend directory first"
    echo ""
    echo "Quick setup:"
    echo "  1. cd frontend && npm install && npm run build"
    echo "  2. cd .. && cd backend && npm install"
    echo "  3. npm start"
    exit 1
fi

# Start backend
cd backend
echo "📱 Starting backend on port ${PORT:-3000}..."
npm start
