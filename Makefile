# CMS Platform — Common Commands
# Run `make help` for available commands

.PHONY: help dev stop restart logs seed clean test lint build prod

# ── Help ─────────────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Development ──────────────────────────────────────────────
dev: ## Start all services in development mode
	docker compose up -d
	@echo "🚀 Services started:"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Strapi API:  http://localhost:1337"
	@echo "  Admin Panel: http://localhost:1337/admin"
	@echo "  Meilisearch: http://localhost:7700"
	@echo "  MinIO:       http://localhost:9001"
	@echo "  Mailpit:     http://localhost:8025"
	@echo "  Redis UI:    http://localhost:8081"

dev-logs: ## Follow all service logs
	docker compose logs -f

dev-logs-api: ## Follow API logs
	docker compose logs -f api

dev-logs-web: ## Follow web logs
	docker compose logs -f web

stop: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

restart-api: ## Restart API service
	docker compose restart api

restart-web: ## Restart web service
	docker compose restart web

# ── Production ───────────────────────────────────────────────
prod: ## Start all services in production mode
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "🚀 Production services started"

prod-logs: ## Follow production logs
	docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# ── Database ─────────────────────────────────────────────────
migrate: ## Run Prisma migrations
	docker compose exec api npx prisma migrate dev

migrate-prod: ## Run Prisma migrations in production
	docker compose exec api npx prisma migrate deploy

db-push: ## Push Prisma schema to database (dev only, no migrations)
	docker compose exec api npx prisma db push

db-studio: ## Open Prisma Studio (database GUI)
	docker compose exec api npx prisma studio

seed: ## Seed database with sample data
	docker compose exec api npm run seed

db-reset: ## Reset database and reseed
	docker compose exec api npx prisma db push --force-reset
	docker compose exec api npm run seed

# ── Search ───────────────────────────────────────────────────
search-reindex: ## Reindex all posts in Meilisearch
	docker compose exec api node -e "const s = require('./src/services/search-service'); s.configureSearchIndex().then(() => console.log('Index configured')).catch(console.error)"

# ── Testing ──────────────────────────────────────────────────
test: ## Run all tests
	docker compose exec api npm run test
	docker compose exec web npm run test

test-api: ## Run API tests
	docker compose exec api npm run test -- --coverage

test-web: ## Run web tests
	docker compose exec web npm run test -- --coverage

lint: ## Lint all code
	docker compose exec api npm run lint
	docker compose exec web npm run lint

type-check: ## Type check all code
	docker compose exec api npx tsc --noEmit
	docker compose exec web npx tsc --noEmit

# ── Build ────────────────────────────────────────────────────
build: ## Build all services
	docker compose build

build-api: ## Build API service
	docker compose build api

build-web: ## Build web service
	docker compose build web

# ── Shell Access ─────────────────────────────────────────────
shell-api: ## Open shell in API container
	docker compose exec api sh

shell-web: ## Open shell in web container
	docker compose exec web sh

shell-db: ## Open PostgreSQL shell
	docker compose exec postgres psql -U cms_user -d cms_db

shell-redis: ## Open Redis CLI
	docker compose exec redis redis-cli

# ── Cleanup ──────────────────────────────────────────────────
clean: ## Stop and remove all containers
	docker compose down

clean-all: ## Stop and remove all containers + volumes
	docker compose down -v
	@echo "⚠️ All data has been removed"

clean-logs: ## Clean up Docker logs
	docker compose logs --no-log-prefix 2>/dev/null | head -0

# ── Utilities ────────────────────────────────────────────────
status: ## Show service status
	docker compose ps

stats: ## Show resource usage
	docker stats --no-stream

backup-db: ## Backup database
	docker compose exec postgres pg_dump -U cms_user cms_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up"

backup-media: ## Backup media files
	docker compose exec api tar czf /tmp/media_backup.tar.gz /app/public/uploads
	docker cp $(shell docker compose ps -q api):/tmp/media_backup.tar.gz ./media_backup_$(shell date +%Y%m%d_%H%M%S).tar.gz
	@echo "✅ Media files backed up"
