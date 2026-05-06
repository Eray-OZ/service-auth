#!/bin/bash

# Render Deployment Script
# This script helps prepare the application for deployment to Render

echo "🚀 Preparing Authentication Microservice for Render deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with your environment variables."
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
fi

# Check if JWT secrets are set
if ! grep -q "JWT_SECRET=" .env; then
    echo "❌ JWT_SECRET not found in .env file"
    exit 1
fi

if ! grep -q "JWT_REFRESH_SECRET=" .env; then
    echo "❌ JWT_REFRESH_SECRET not found in .env file"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building the application..."
npm run build

# Run tests if they exist
if [ -f "package.json" ] && grep -q "test" package.json; then
    echo "🧪 Running tests..."
    npm test
fi

echo "✅ Application is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Create a new Web Service on Render"
echo "3. Connect your GitHub repository"
echo "4. Configure environment variables in Render dashboard"
echo "5. Deploy!"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
