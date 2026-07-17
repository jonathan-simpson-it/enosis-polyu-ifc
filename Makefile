.PHONY: dev build stop frontend-dev frontend-build backend-deps

dev: ## Start API + frontend
	npm run dev

frontend-dev: ## Start Next.js frontend only
	npm run dev:frontend

frontend-build: ## Build Next.js frontend
	npm run build

backend-deps: ## Install backend dependencies
	pip install -r backend/requirements.txt

stop: ## Kill API + frontend servers
	-kill $$(lsof -ti :8000) 2>/dev/null
	-kill $$(lsof -ti :3000) 2>/dev/null
	@echo "Stopped"

db-up: ## Start PostgreSQL
	npm run db:up

db-down: ## Stop PostgreSQL
	npm run db:down

db-migrate: ## Run Alembic migrations
	npm run db:migrate

db-seed: ## Seed HS codes
	npm run db:seed

setup: ## Full setup
	brew install tesseract 2>/dev/null || true
	npm install
	pip install -r backend/requirements.txt
	npm run setup

help:
	@grep -E '^[a-zA-Z_-]+:.*?##' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
