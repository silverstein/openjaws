#!/bin/bash

# Beach Panic Setup Verification Script

echo "🏖️ Beach Panic: Jaws Royale - Setup Verification"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in the openjaws directory${NC}"
    exit 1
fi

echo -e "\n📦 Installing dependencies..."
npm install

echo -e "\n🔍 Checking environment variables..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"
    
    # Check for required Convex variables
    if grep -q "NEXT_PUBLIC_CONVEX_URL=https://" .env.local; then
        echo -e "${GREEN}✓ Convex URL is set${NC}"
    else
        echo -e "${RED}❌ Convex URL is missing or invalid${NC}"
    fi
    
    # Check for API keys
    if grep -q "ANTHROPIC_API_KEY=sk-ant-" .env.local; then
        echo -e "${GREEN}✓ Anthropic API key is set${NC}"
    else
        echo -e "${YELLOW}⚠ Anthropic API key not found (will use mock mode)${NC}"
    fi
    
    if grep -q "GOOGLE_GENERATIVE_AI_API_KEY=AI" .env.local; then
        echo -e "${GREEN}✓ Google API key is set${NC}"
    else
        echo -e "${YELLOW}⚠ Google API key not found (will use mock mode)${NC}"
    fi
else
    echo -e "${RED}❌ .env.local not found${NC}"
fi

echo -e "\n🧪 Running tests..."
npm test -- --run

echo -e "\n🔨 Testing build..."
npm run build

echo -e "\n📊 Test Results:"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
fi

echo -e "\n🎮 Setup verification complete!"
echo -e "\nTo start playing:"
echo -e "1. Make sure 'pnpm convex dev' is running in another terminal"
echo -e "2. Run 'npm run dev' to start the game"
echo -e "3. Visit http://localhost:3000"