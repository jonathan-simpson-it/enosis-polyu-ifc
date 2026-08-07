.PHONY: dev build lint typecheck stop

dev: ## Start Next.js dev server
	npm run dev

build: ## Production build
	npm run build

lint: ## Lint frontend
	npm run lint

typecheck: ## TypeScript check
	npm run typecheck

stop: ## Kill dev servers
	-kill $$(lsof -ti :3000) 2>/dev/null
	@echo "Stopped"

help:
	@grep -E '^[a-zA-Z_-]+:.*?##' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
