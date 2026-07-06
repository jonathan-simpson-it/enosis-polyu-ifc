.PHONY: dev demo seed stop

dev: ## Start API + CMS, seed DB, run demo
	./scripts/run.sh

demo: ## Run demo (servers must already be running)
	.venv/bin/python scripts/run_demo.py

seed: ## Seed database
	.venv/bin/python scripts/seed_database.py

stop: ## Kill API + CMS servers
	-kill $$(lsof -ti :8000) 2>/dev/null
	-kill $$(lsof -ti :8080) 2>/dev/null
	@echo "Stopped"

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?##' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
