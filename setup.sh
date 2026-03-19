#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Ready2Spray - Open Source Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not available.${NC}"
    echo "Update Docker Desktop or install docker-compose-plugin"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not running.${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo -e "${BLUE}[1/4] Setting up environment...${NC}"

# Generate .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 64)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/CHANGE_ME_TO_A_RANDOM_STRING_AT_LEAST_32_CHARS/$JWT_SECRET/" .env
    else
        sed -i "s/CHANGE_ME_TO_A_RANDOM_STRING_AT_LEAST_32_CHARS/$JWT_SECRET/" .env
    fi
    echo -e "${GREEN}  ✓ Created .env with secure JWT secret${NC}"
else
    echo -e "${YELLOW}  → .env already exists, skipping${NC}"
fi

echo -e "${BLUE}[2/4] Building and starting containers...${NC}"
echo "  This may take a few minutes on first run..."
echo ""
docker compose up --build -d

echo ""
echo -e "${BLUE}[3/4] Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo -n "  Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U ready2spray &>/dev/null; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}PostgreSQL failed to start. Check: docker compose logs db${NC}"
        exit 1
    fi
    sleep 2
done

# Wait for app
echo -n "  Waiting for application..."
for i in $(seq 1 60); do
    if curl -sf http://localhost:3000/api/health &>/dev/null; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}Application failed to start. Check: docker compose logs app${NC}"
        exit 1
    fi
    sleep 3
done

# Check Ollama (don't fail if slow - model pull takes time)
echo -n "  Waiting for Ollama + Qwen model..."
echo -e " ${YELLOW}(model download may take a few minutes)${NC}"

echo ""
echo -e "${BLUE}[4/4] Setup complete!${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Ready2Spray is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}App:${NC}     http://localhost:3000"
echo -e "  ${BLUE}Login:${NC}   Click 'Demo Login' on the login page"
echo ""
echo -e "  ${YELLOW}Optional integrations:${NC}"
echo -e "  • Google Maps  → Add GOOGLE_MAPS_API_KEY to .env"
echo -e "  • FieldPulse   → Configure in Settings > Integrations"
echo -e "  • Zoho CRM     → Configure in Settings > Integrations"
echo ""
echo -e "  See docs/INTEGRATIONS.md for setup guides."
echo ""
echo -e "  ${BLUE}Useful commands:${NC}"
echo -e "  docker compose logs -f app     # View app logs"
echo -e "  docker compose logs -f ollama  # View AI model logs"
echo -e "  docker compose down            # Stop all services"
echo -e "  docker compose up -d           # Restart services"
echo ""
