# Makefile for Recipe Manager Application
# Use 'make help' to see all available commands

.PHONY: help setup install dev stop clean migrate test-backend test-frontend test-image-upload test-search test-all lint logs shell-backend shell-db

# Default target - show help
help:
	@echo "Recipe Manager - Available Commands"
	@echo "===================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup          - Initial project setup (first time only)"
	@echo "  make install        - Install frontend and backend dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start all services with Docker Compose"
	@echo "  make stop           - Stop all running services"
	@echo "  make clean          - Stop services and remove volumes/cache"
	@echo "  make migrate        - Run database migrations"
	@echo ""
	@echo "Testing:"
	@echo "  make test-backend      - Run all backend tests (pytest)"
	@echo "  make test-frontend     - Run all frontend tests (Jest)"
	@echo "  make test-image-upload - Run image upload tests only (backend + frontend)"
	@echo "  make test-search       - Run full-text search tests (backend)"
	@echo "  make test-all          - Run all tests (backend + frontend)"
	@echo "  make lint              - Run linters for both frontend and backend"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs           - View logs from all services"
	@echo "  make shell-backend  - Open a shell in the backend container"
	@echo "  make shell-db       - Open psql shell in the database"
	@echo ""

# Initial setup - run this once when first cloning the repo
setup:
	@echo "Setting up Recipe Manager..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ Created .env file from .env.example"; \
	else \
		echo "✓ .env file already exists"; \
	fi
	@echo "Installing dependencies..."
	@$(MAKE) install
	@echo ""
	@echo "✓ Setup complete! Run 'make dev' to start the application."

# Install all dependencies
install:
	@echo "Installing backend dependencies..."
	@cd backend && pip install -r requirements.txt
	@echo "✓ Backend dependencies installed"
	@echo ""
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "✓ Frontend dependencies installed"

# Start all services with Docker Compose
dev:
	@echo "Starting all services..."
	@docker compose up -d
	@echo ""
	@echo "✓ Services started!"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"
	@echo ""
	@echo "Run 'make logs' to view logs"
	@echo "Run 'make stop' to stop all services"

# Stop all services
stop:
	@echo "Stopping all services..."
	@docker compose stop
	@echo "✓ All services stopped"

# Clean up everything - removes containers, volumes, and cache
clean:
	@echo "Cleaning up containers, volumes, and cache..."
	@docker compose down -v
	@echo "Removing backend cache..."
	@find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find backend -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "Removing frontend cache..."
	@rm -rf frontend/.next 2>/dev/null || true
	@echo "✓ Cleanup complete"

# Run database migrations
migrate:
	@echo "Running database migrations..."
	@docker compose exec backend alembic upgrade head
	@echo "✓ Migrations complete"

# Run backend tests
test-backend:
	@echo "Running backend tests..."
	@docker compose exec backend pytest -v
	@echo "✓ Backend tests complete"

# Run frontend tests
test-frontend:
	@echo "Running frontend tests..."
	@docker compose exec frontend npm run test
	@echo "✓ Frontend tests complete"

# Run image upload tests only (backend + frontend)
test-image-upload:
	@echo "Running image upload tests..."
	@echo ""
	@echo "Backend Image Upload Tests:"
	@echo "----------------------------"
	@docker compose exec backend pytest test_api.py::TestImageUpload -v
	@echo ""
	@echo "Frontend Image Upload Tests (New Recipe):"
	@echo "------------------------------------------"
	@docker compose exec frontend npm test -- NewRecipePage.test.tsx --passWithNoTests
	@echo ""
	@echo "Frontend Image Upload Tests (Edit Recipe):"
	@echo "-------------------------------------------"
	@docker compose exec frontend npm test -- EditRecipePage.test.tsx --passWithNoTests
	@echo ""
	@echo "✓ All image upload tests complete"

# Run full-text search tests (backend)
test-search:
	@echo "Running full-text search tests..."
	@echo ""
	@docker compose exec backend pytest test_api.py::TestFullTextSearch -v
	@echo ""
	@echo "✓ Full-text search tests complete"

# Run all tests (backend + frontend)
test-all:
	@echo "Running all tests..."
	@echo ""
	@echo "Backend Tests:"
	@echo "-------------"
	@$(MAKE) test-backend
	@echo ""
	@echo "Frontend Tests:"
	@echo "--------------"
	@$(MAKE) test-frontend
	@echo ""
	@echo "✓ All tests complete"

# Run linters for both frontend and backend
lint:
	@echo "Running linters..."
	@echo ""
	@echo "Linting backend (Python)..."
	@docker compose exec backend python -m flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || true
	@echo ""
	@echo "Linting frontend (TypeScript/JavaScript)..."
	@docker compose exec frontend npm run lint || true
	@echo ""
	@echo "✓ Linting complete"

# View logs from all services
logs:
	@echo "Showing logs from all services (Ctrl+C to exit)..."
	@docker compose logs -f

# Open a shell in the backend container
shell-backend:
	@echo "Opening shell in backend container..."
	@docker compose exec backend /bin/bash

# Open a psql shell in the database
shell-db:
	@echo "Opening PostgreSQL shell..."
	@docker compose exec db psql -U recipe_user -d recipe_db
