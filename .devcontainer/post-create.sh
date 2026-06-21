#!/bin/bash

# Post-create script for dev container
set -e

echo "🚀 Setting up Member Management System dev environment..."

# Install system dependencies
echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y make curl postgresql-client

# Create environment file
echo "📝 Creating environment files..."
if [ ! -f .env.development ]; then
  cp .env.example .env.development
  echo "✓ .env.development created"
fi

# Install Go dependencies
echo "📚 Installing Go dependencies..."
cd backend
go mod download
go install github.com/cosmtrek/air@latest
cd ..

# Install frontend dependencies
echo "📚 Installing frontend dependencies..."
cd frontend
npm ci
cd ..

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build --no-cache

echo ""
echo "✅ Dev environment ready!"
echo ""
echo "📖 Next steps:"
echo "   make dev          - Start development environment"
echo "   make logs         - View service logs"
echo "   make help         - Show all available commands"
echo ""
