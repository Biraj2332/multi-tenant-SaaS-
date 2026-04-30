.PHONY: help build dev up down logs restart clean prune ps shell-api shell-web db-connect redis-cli

# Docker Compose files
DEV_COMPOSE=docker-compose.dev.yml
PROD_COMPOSE=docker-compose.prod.yml

# Default target
help:
	@echo "TenantOps Docker Management"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build development images"
	@echo "  make dev-down     - Stop development environment"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-restart  - Restart development environment"
	@echo ""
	@echo "Production:"
	@echo "  make prod-up      - Start production environment"
	@echo "  make prod-down    - Stop production environment"
	@echo "  make prod-build   - Build production images"
	@echo ""
	@echo "Containers:"
	@echo "  make shell-api    - Open shell in API container"
	@echo "  make shell-web    - Open shell in Web container"
	@echo "  make db-connect   - Connect to PostgreSQL database"
	@echo "  make redis-cli    - Connect to Redis CLI"
	@echo "  make ps           - List all containers"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Remove containers, volumes, and images"
	@echo "  make prune        - Docker system prune"
	@echo "  make format       - Format code with Biome"

# Development commands
dev: dev-build
	@docker-compose -f $(DEV_COMPOSE) up -d
	@echo "[>>] Frontend: http://localhost:5173"
	@echo "[>>] Backend:  http://localhost:13000"
	@echo "[>>] API Docs: http://localhost:13000/docs"
	@echo "[>>] Database: localhost:5432 (user: tenantops, pass: password)"

dev-build:
	@docker-compose -f $(DEV_COMPOSE) build --no-cache

dev-down:
	@docker-compose -f $(DEV_COMPOSE) down

dev-logs:
	@docker-compose -f $(DEV_COMPOSE) logs -f

dev-restart: dev-down dev

# Production commands
prod-up:
	@docker-compose -f $(PROD_COMPOSE) up -d

prod-down:
	@docker-compose -f $(PROD_COMPOSE) down

prod-build:
	@docker-compose -f $(PROD_COMPOSE) build --no-cache

# Container access
shell-api:
	@docker exec -it tenantops-api-dev /bin/sh

shell-web:
	@docker exec -it tenantops-web-dev /bin/sh

db-connect:
	@docker exec -it tenantops-postgres-dev psql -U tenantops -d tenantops_dev

redis-cli:
	@docker exec -it tenantops-redis-dev redis-cli

# Maintenance
ps:
	@docker ps -a

clean:
	@docker-compose -f $(DEV_COMPOSE) down -v
	@docker-compose -f $(PROD_COMPOSE) down -v
	@docker system prune -af

prune:
	@docker system prune -af

format:
	@docker exec tenantops-api-dev npx biome format --write .
	@docker exec tenantops-web-dev npx biome format --write .
