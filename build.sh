#!/bin/bash

echo "🔨 Building Presence Esisar (Frontend + Backend)..."
echo ""

# Build Frontend
echo "📦 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Start backend: cd backend && npm start"
echo "  2. Access on: http://localhost:3000"
echo ""
