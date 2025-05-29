#!/bin/bash

# Backend Setup Script for Perspective App
# This script helps set up the backend development environment

echo "🚀 Setting up Perspective Backend..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your local configuration."
else
    echo "✅ .env file already exists."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed."
else
    echo "✅ Dependencies already installed."
fi

# Check if Docker is running
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo "🐳 Docker is running."
        
        # Ask user if they want to use Docker
        read -p "Would you like to start PostgreSQL and Redis using Docker? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🚀 Starting Docker services..."
            docker-compose up -d postgres redis
            echo "⏳ Waiting for PostgreSQL to be ready..."
            sleep 5
            echo "✅ Docker services started."
        fi
    else
        echo "⚠️  Docker is installed but not running. Please start Docker if you want to use containerized services."
    fi
else
    echo "⚠️  Docker not found. You'll need to set up PostgreSQL manually."
fi

# Run migrations
echo ""
read -p "Would you like to run database migrations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Running database migrations..."
    npm run migrate
    echo "✅ Migrations completed."
fi

# Run seeds
echo ""
read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run seed
    echo "✅ Database seeded."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "The API will be available at http://localhost:3000"
echo ""
echo "Don't forget to:"
echo "  1. Update your .env file with proper credentials"
echo "  2. Ensure PostgreSQL is running"
echo "  3. Check the API documentation in ../docs/API.md" 