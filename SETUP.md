# Setup Guide - Recipe Manager

This guide will help you set up the Recipe Manager application on your local machine.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Troubleshooting](#troubleshooting)
5. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Docker Desktop** (includes Docker Compose v2)
  - macOS/Windows: https://www.docker.com/products/docker-desktop
  - Linux: https://docs.docker.com/engine/install/
  - Version: 20.10+ recommended

- **Make** (usually pre-installed on macOS/Linux)
  - macOS: Comes with Xcode Command Line Tools
  - Windows: Install via `winget install GnuWin32.Make` or WSL
  - Linux: Install via package manager (`sudo apt install make`)

- **Git**
  - Download: https://git-scm.com/downloads
  - Version: 2.x+ recommended

### Optional (for local development without Docker)

- **Node.js 24+** and **npm**
- **Python 3.13+**
- **PostgreSQL 16+**

**Recommended:** Use [mise](https://mise.jdx.dev/) for managing Node.js and Python versions (see `.mise.toml` in the project root).

---

## Quick Start

Get up and running in 3 commands:

```bash
# 1. Clone the repository
git clone https://github.com/codemauri/ai-dev-session-1.git
cd ai-dev-session-1

# 2. Initial setup (creates .env, installs dependencies)
make setup

# 3. Start all services (database, backend, frontend)
make dev
```

That's it! The application should now be running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Database:** localhost:5432

**First time?** You'll need to run database migrations:

```bash
make migrate
```

---

## Detailed Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/codemauri/ai-dev-session-1.git
cd ai-dev-session-1
```

Or if you forked the repository:

```bash
git clone https://github.com/YOUR_USERNAME/ai-dev-session-1.git
cd ai-dev-session-1
```

### Step 2: Environment Configuration

The `make setup` command automatically creates a `.env` file from `.env.example`. If you want to customize it:

```bash
cp .env.example .env
```

Edit `.env` with your preferred settings:

```env
# Database Configuration
DB_NAME=recipe_db
DB_USER=recipe_user
DB_PASSWORD=recipe_password
DB_HOST=db
DB_PORT=5432

# Database URL (used by backend)
DATABASE_URL=postgresql+psycopg://recipe_user:recipe_password@db:5432/recipe_db
```

**Note:** For local development with Docker, the default values work out of the box.

### Step 3: Install Dependencies

#### Option A: Using Make (Recommended for Docker)

```bash
make install
```

This installs:
- Backend Python dependencies (`pip install -r backend/requirements.txt`)
- Frontend npm packages (`npm install` in `frontend/`)

#### Option B: Manual Installation

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 4: Start the Application

#### Option A: Using Docker Compose (Recommended)

Start all services (PostgreSQL, Backend, Frontend):

```bash
make dev
```

This runs `docker compose up -d` in detached mode (background).

**View logs:**
```bash
make logs
```

**Stop services:**
```bash
make stop
```

#### Option B: Manual Startup (without Docker)

**Terminal 1 - Start PostgreSQL:**
```bash
docker compose up db
```

**Terminal 2 - Start Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 3 - Start Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Run Database Migrations

Create the database tables:

```bash
make migrate
```

Or manually:

```bash
docker compose exec backend alembic upgrade head
```

### Step 6: Verify Installation

1. Open http://localhost:3000 in your browser
2. You should see the Recipe Manager home page
3. Try creating a recipe to ensure everything works

**Check service health:**

```bash
# Backend health check
curl http://localhost:8000/health

# View all running containers
docker compose ps
```

---

## Development Workflow

### Daily Development

```bash
# Start the application
make dev

# View logs (Ctrl+C to exit)
make logs

# Run tests
make test-backend
make test-frontend

# Stop when done
make stop
```

### Making Changes

**Backend changes:**
- Edit files in `backend/`
- Changes are hot-reloaded automatically (no restart needed)
- If you modify `requirements.txt`, rebuild: `docker compose up -d --build backend`

**Frontend changes:**
- Edit files in `frontend/`
- Changes are hot-reloaded automatically
- If you modify `package.json`, rebuild: `docker compose up -d --build frontend`

**Database migrations:**
```bash
# Create a new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
make migrate
```

### Cleaning Up

**Remove all containers and volumes (fresh start):**
```bash
make clean
```

**Reset database only:**
```bash
docker compose down -v  # Removes volumes
docker compose up -d db
make migrate
```

---

## Troubleshooting

### Port Already in Use

**Error:** `port is already allocated`

**Solution:**
```bash
# Check what's using the port
lsof -i :3000  # or :8000, :5432

# Stop the application
make stop

# Or change ports in docker-compose.yml
```

### Docker Issues

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
- Ensure Docker Desktop is running
- Restart Docker Desktop
- Check Docker status: `docker ps`

### Database Connection Errors

**Error:** `could not connect to server: Connection refused`

**Solution:**
```bash
# Check if database is running
docker compose ps

# Restart database
docker compose restart db

# Check logs
docker compose logs db
```

### Permission Errors (Linux)

**Error:** `permission denied`

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

### Frontend Build Errors

**Error:** `Module not found` or `Cannot find module`

**Solution:**
```bash
# Rebuild frontend container
docker compose up -d --build frontend

# Or manually reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend Import Errors

**Error:** `ModuleNotFoundError`

**Solution:**
```bash
# Rebuild backend container
docker compose up -d --build backend

# Or manually reinstall
cd backend
pip install -r requirements.txt
```

---

## Running Tests

### Backend Tests (pytest)

```bash
# All tests
make test-backend

# Specific test file
docker compose exec backend pytest test_api.py -v

# With coverage
docker compose exec backend pytest --cov=. --cov-report=html
```

### Frontend Tests (Jest)

```bash
# All tests (CI mode)
make test-frontend

# Watch mode (for development)
cd frontend
npm run test
```

---

## Next Steps

Once setup is complete:

1. **Explore the API:** Visit http://localhost:8000/docs for interactive API documentation
2. **Read Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system design
3. **Start Developing:** See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
4. **Create Sample Data:** Use the frontend or API docs to add recipes and categories

---

## Additional Resources

- **API Documentation:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Architecture Overview:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Contributing Guide:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Next.js Docs:** https://nextjs.org/docs
- **Docker Docs:** https://docs.docker.com/

---

## Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/codemauri/ai-dev-session-1/issues)
3. Create a new issue with error messages and steps to reproduce

---

**Happy Coding! 🚀**
