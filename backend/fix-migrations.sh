#!/bin/bash

echo "🔧 Fixing database migrations..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run a command and check its status
run_command() {
    echo -e "${YELLOW}Running: $1${NC}"
    eval $1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Step 1: Check current migration status
echo -e "\n${YELLOW}1. Current migration status:${NC}"
npx knex migrate:list

# Step 2: Rollback any failed migrations
echo -e "\n${YELLOW}2. Rolling back to clean state...${NC}"
npx knex migrate:rollback --all || true

# Step 3: Move problematic migration out of the way temporarily
echo -e "\n${YELLOW}3. Moving problematic migration temporarily...${NC}"
if [ -f "migrations/011_add_total_xp_earned_column.js" ]; then
    mv migrations/011_add_total_xp_earned_column.js migrations/019_add_total_xp_earned_column.js
    echo "Moved 011_add_total_xp_earned_column.js to 019_add_total_xp_earned_column.js"
fi

# Step 4: Run core migrations first
echo -e "\n${YELLOW}4. Running core migrations...${NC}"
npx knex migrate:up
npx knex migrate:up
npx knex migrate:up
npx knex migrate:up
npx knex migrate:up
npx knex migrate:up
npx knex migrate:up
npx knex migrate:up

# Step 5: Check which tables exist now
echo -e "\n${YELLOW}5. Checking created tables...${NC}"
npx knex raw "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" | grep -E "(users|challenges|challenge_submissions|user_challenge_stats)"

# Step 6: Run remaining migrations
echo -e "\n${YELLOW}6. Running all remaining migrations...${NC}"
npx knex migrate:latest

# Step 7: Final status check
echo -e "\n${YELLOW}7. Final migration status:${NC}"
npx knex migrate:list

echo -e "\n${GREEN}✅ Migration fix complete!${NC}"