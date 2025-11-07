# Tutorial Reset Guide - Recipe Manager

## Analysis Summary

This guide explains how to reset the main branch to serve as a proper starting point for the agentic programming tutorial with Claude Code.

## Current Problem

The main branch currently contains a **complete implementation** rather than a starting point for the tutorial. This makes Prompts 1-9 in the README.md redundant.

### Branch Comparison Results

**Main branch vs solution-1 branch:**
- Main branch: 45 source files
- Solution-1 branch: 48 source files
- Difference: Only 3 additional files in solution-1

**Files that differ (8 total):**
1. `backend/database.py` - solution-1 uses `postgresql+psycopg://`
2. `backend/requirements.txt` - solution-1 has Python 3.13 compatible versions
3. `backend/seed.py` - NEW in solution-1 (sample data seeder)
4. `frontend/lib/api.ts` - NEW in solution-1 (API client)
5. `frontend/package-lock.json` - NEW in solution-1
6. `Makefile` - solution-1 adds `make seed` command
7. `.gitignore` - Minor differences
8. `README.md` - Minor text differences

**Critical Finding:** Both branches have IDENTICAL core structure!

All backend files (17 files) exist in both branches:
- main.py, models.py, routers.py, crud.py, schemas.py, database.py
- All Alembic migrations
- All tests (test_api.py, conftest.py)
- Dockerfile, requirements.txt

All frontend files (22 files) exist in both branches:
- All pages (home, recipes list, detail, new, edit)
- All components (Navbar, RecipeCard, RecipeForm)
- All tests
- All config files (Next.js, TypeScript, Tailwind, ESLint, Jest)

## 🎯 Goal: Make Main Branch a Proper Starting Point

The learner should start with **only the tutorial instructions** and build everything using the 9 prompts.

---

## ❌ DELETE (Complete Implementations)

### Delete ALL backend implementation:
```bash
rm -rf backend/
```

### Delete ALL frontend implementation:
```bash
rm -rf frontend/
```

These should be **completely rebuilt** by the prompts.

---

## ✅ KEEP AS-IS (Tutorial Documentation)

Keep these files unchanged:
- ✅ `README.md` (contains the 9 prompts)
- ✅ `QUICKSTART.md`
- ✅ `README-MISE.md`
- ✅ `LICENSE`
- ✅ `.git/` directory

---

## 📝 CHANGE TO STUBS (Minimal Templates)

### 1. Replace docker-compose.yml with a stub:

Create a minimal stub that shows the structure but needs to be filled in:

```yaml
# Docker Compose Configuration for Recipe Manager
# This is a stub file - complete this using the prompts in README.md

version: '3.8'

services:
  # TODO: Add PostgreSQL database service (see Prompt 3)
  # db:

  # TODO: Add backend service (see Prompt 6)
  # backend:

  # TODO: Add frontend service (see Prompt 6)
  # frontend:

# TODO: Add volumes
# volumes:

# TODO: Add networks
# networks:
```

### 2. Replace Makefile with a stub:

Create a minimal stub:

```makefile
# Makefile for Recipe Manager Application
# This is a stub file - complete this using the prompts in README.md

.PHONY: help

# Default target - show help
help:
	@echo "Recipe Manager - Makefile"
	@echo "=========================="
	@echo ""
	@echo "This Makefile is incomplete. Follow the prompts in README.md to build it."
	@echo "See Prompt 7 for Makefile implementation instructions."
	@echo ""

# TODO: Add setup target (see Prompt 7)
# setup:

# TODO: Add install target (see Prompt 7)
# install:

# TODO: Add dev target (see Prompt 7)
# dev:

# TODO: Add other targets as described in Prompt 7
```

### 3. Update .env.example:

Keep this but make it simpler:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recipe_db
DB_USER=recipe_user
DB_PASSWORD=recipe_password

# Application Environment
ENVIRONMENT=development
NODE_ENV=development

# API Configuration (for frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Update .gitignore:

Keep it but ensure it properly ignores:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
.venv

# Node
node_modules/
.next/
npm-debug.log*

# Environment
.env

# Database
*.db
*.sqlite

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
postgres_data/
```

---

## 📋 OPTIONAL: Keep as Reference

You might want to keep these for reference (but not required by tutorial):

**Option 1: Keep them in main** (learners can reference them)
- ✅ `ARCHITECTURE.md` - Shows target architecture
- ✅ `SETUP.md` - Installation guide
- ✅ `CONTRIBUTING.md` - Development guidelines

**Option 2: Delete them** (they'll be created in Prompt 9)
- Let learners create these fresh

**Recommendation:** Keep them as they provide helpful context.

---

## 🚀 COMPLETE ACTION PLAN

Here's the exact sequence of commands to run:

```bash
# 1. Delete all implementation code
rm -rf backend/
rm -rf frontend/

# 2. Create stub docker-compose.yml
cat > docker-compose.yml << 'EOF'
# Docker Compose Configuration for Recipe Manager
# This is a stub file - complete this using the prompts in README.md

version: '3.8'

services:
  # TODO: Add PostgreSQL database service (see Prompt 3)
  # db:

  # TODO: Add backend service (see Prompt 6)
  # backend:

  # TODO: Add frontend service (see Prompt 6)
  # frontend:

# TODO: Add volumes
# volumes:

# TODO: Add networks
# networks:
EOF

# 3. Create stub Makefile
cat > Makefile << 'EOF'
# Makefile for Recipe Manager Application
# This is a stub file - complete this using the prompts in README.md

.PHONY: help

help:
	@echo "Recipe Manager - Makefile"
	@echo "=========================="
	@echo ""
	@echo "This Makefile is incomplete. Follow the prompts in README.md to build it."
	@echo "See Prompt 7 for Makefile implementation instructions."
	@echo ""

# TODO: See Prompt 7 for implementation
EOF

# 4. Verify what's left
ls -la

# 5. Commit the changes
git add -A
git commit -m "Reset main branch to tutorial starting point - stubs only"
git push origin main
```

---

## ✅ VERIFICATION: What Main Should Look Like After Reset

```
ai-dev-session-1/
├── .env.example          ✅ Keep (template)
├── .gitignore            ✅ Keep (updated)
├── docker-compose.yml    ✅ Stub only
├── Makefile              ✅ Stub only
├── README.md             ✅ Keep (tutorial prompts)
├── README-MISE.md        ✅ Keep (installation guide)
├── QUICKSTART.md         ✅ Keep (optional)
├── ARCHITECTURE.md       ✅ Keep (optional - shows target)
├── SETUP.md              ✅ Keep (optional - shows target)
├── CONTRIBUTING.md       ✅ Keep (optional)
├── LICENSE               ✅ Keep
└── .mise.toml            ✅ Keep (runtime manager config)

NO backend/ directory
NO frontend/ directory
```

---

## 🎓 AFTER RESET: Tutorial Flow

A learner would then:

1. **Clone the repo**
2. **Read README.md**
3. **Run Prompt 1** → Creates `frontend/` directory with Next.js
4. **Run Prompt 2** → Creates `backend/` directory with FastAPI
5. **Run Prompt 3** → Creates database models, adds PostgreSQL to docker-compose
6. **Run Prompt 4** → Adds API endpoints
7. **Run Prompt 5** → Adds frontend UI and API client
8. **Run Prompt 6** → Completes docker-compose.yml
9. **Run Prompt 7** → Completes Makefile
10. **Run Prompt 8** → Adds tests
11. **Run Prompt 9** → Adds/updates documentation
12. **Run setup steps**: `make setup && make install && make dev && make migrate`
13. **App works!** 🎉

---

## 📌 Summary

| Action | Files |
|--------|-------|
| **DELETE** | `backend/`, `frontend/` |
| **STUB** | `Makefile`, `docker-compose.yml` |
| **KEEP** | `README.md`, `.env.example`, `.gitignore`, docs |

This creates a **true starting point** where all 9 prompts are **required and non-redundant**! 🎯

---

## What make reset Does

`make reset` runs `clean` then `setup`:

### make clean:
- Stops and removes all Docker containers
- **DELETES all Docker volumes** (including database data)
- Removes cache directories:
  - `backend/__pycache__/`
  - `backend/.pytest_cache/`
  - `frontend/.next/`
  - `frontend/node_modules/`

### Then runs make setup:
- Recreates `.env` from `.env.example`

### What SURVIVES:
- ✅ All source code files (`.py`, `.tsx`, `.ts`)
- ✅ All configuration files

### What is LOST:
- ❌ All database data (recipes, categories, etc.)
- ❌ node_modules (needs reinstall)
- ❌ Build caches

**Important:** `make reset` does NOT delete source code, so it won't put you in a state to use the 9 prompts. You'd still need to manually delete `backend/` and `frontend/` directories.

---

## Conclusion

The main branch is misconfigured as a complete solution rather than a tutorial starting point. To fix this and enable the intended learning experience, you need to:

1. Delete the complete implementations (backend/ and frontend/)
2. Replace complete files with stubs (Makefile, docker-compose.yml)
3. Keep tutorial documentation

This will make all 9 prompts necessary and non-redundant, creating the intended hands-on learning experience with Claude Code.
