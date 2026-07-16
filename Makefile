.PHONY: dev demo seed stop frontend-dev frontend-build

dev: ## Start all services (API + frontend + CMS)
	./scripts/run.sh

demo: ## Run demo (servers must already be running)
	.venv/bin/python scripts/run_demo.py

seed: ## Seed database
	.venv/bin/python scripts/seed_database.py

frontend-dev: ## Start Next.js frontend only
	npm run dev:frontend

frontend-build: ## Build Next.js frontend
	npm run build

stop: ## Kill API + CMS + frontend servers
	-kill $$(lsof -ti :8000) 2>/dev/null
	-kill $$(lsof -ti :8080) 2>/dev/null
	-kill $$(lsof -ti :3000) 2>/dev/null
	@echo "Stopped"

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?##' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
