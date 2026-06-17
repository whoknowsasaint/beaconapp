# ──────────────────────────────────────────────
# Beacon- Makefile
# Single entry point for all developer commands.
#
# Usage:
#   make dev          Start both frontend and backend
#   make frontend     Start Next.js dev server only
#   make backend      Start Django dev server only
#   make test         Run all tests (backend)
#   make migrate      Apply all pending migrations
#   make migrations   Create new migrations
#   make lint         Lint backend Python code
#   make install      Install all dependencies
#   make superuser    Create a Django superuser
#   make shell        Open Django shell
#   make psql         Open psql connected to beacon DB
#   make check        Run Django system check
#   make clean        Remove Python cache files
# ──────────────────────────────────────────────

# ─── Configuration ────────────────────────────

PYTHON      = backend/.venv/Scripts/python
PIP         = backend/.venv/Scripts/pip
DJANGO      = $(PYTHON) backend/manage.py
SETTINGS    = --settings=core.settings.development
NPM         = npm
FRONTEND    = frontend

# ─── Colours (Windows PowerShell compatible) ──
# We skip ANSI codes- they don't render reliably
# in all Windows terminals. Clean output only.

# ─── Phony targets ────────────────────────────
# Prevents make from confusing these with files.

.PHONY: dev frontend backend test migrate migrations \
        lint install superuser shell psql check clean \
        help

# ─── Default target ───────────────────────────

help:
	@echo.
	@echo   Beacon Developer Commands
	@echo   ─────────────────────────────────────
	@echo   make install      Install all dependencies
	@echo   make dev          Start frontend + backend
	@echo   make frontend     Start Next.js only
	@echo   make backend      Start Django only
	@echo   make migrate      Apply pending migrations
	@echo   make migrations   Create new migrations
	@echo   make test         Run all backend tests
	@echo   make lint         Lint backend Python
	@echo   make superuser    Create Django superuser
	@echo   make shell        Open Django shell
	@echo   make psql         Open psql (beacon DB)
	@echo   make check        Django system check
	@echo   make clean        Remove cache files
	@echo.

# ─── Install ──────────────────────────────────

install:
	@echo [backend] Creating virtual environment...
	cd backend && python -m venv .venv
	@echo [backend] Installing Python dependencies...
	$(PIP) install -r backend/requirements.txt
	@echo [frontend] Installing Node dependencies...
	cd $(FRONTEND) && $(NPM) install
	@echo Done. Run 'make dev' to start.

# ─── Development Servers ──────────────────────
# Note: Windows doesn't support make's & (background)
# operator reliably. Run frontend and backend in
# separate terminal windows using the individual targets.

frontend:
	@echo [frontend] Starting Next.js dev server on http://localhost:3000
	cd $(FRONTEND) && $(NPM) run dev

backend:
	@echo [backend] Starting Django dev server on http://localhost:8000
	$(DJANGO) runserver $(SETTINGS)

dev:
	@echo.
	@echo   Beacon requires two terminal windows.
	@echo   In terminal 1: make backend
	@echo   In terminal 2: make frontend
	@echo.
	@echo   Backend:  http://localhost:8000
	@echo   Frontend: http://localhost:3000
	@echo   Admin:    http://localhost:8000/admin/
	@echo.

# ─── Database ─────────────────────────────────

migrate:
	@echo [backend] Applying migrations...
	$(DJANGO) migrate $(SETTINGS)

migrations:
	@echo [backend] Creating migrations...
	$(DJANGO) makemigrations $(SETTINGS)

# ─── Testing ──────────────────────────────────

test:
	@echo [backend] Running all tests...
	$(DJANGO) test apps.monitors apps.incidents apps.status_pages $(SETTINGS) --verbosity=2

# ─── Code Quality ─────────────────────────────

lint:
	@echo [backend] Linting Python...
	cd backend && .venv\Scripts\flake8 apps core --max-line-length=100 --exclude=migrations

check:
	@echo [backend] Running Django system check...
	$(DJANGO) check $(SETTINGS)

# ─── Django Utilities ─────────────────────────

superuser:
	@echo [backend] Creating superuser...
	$(DJANGO) createsuperuser $(SETTINGS)

shell:
	@echo [backend] Opening Django shell...
	$(DJANGO) shell $(SETTINGS)

# ─── Database Utilities ───────────────────────

psql:
	@echo [db] Connecting to beacon database...
	psql -U beacon_user -d beacon -h localhost

# ─── Cleanup ──────────────────────────────────

clean:
	@echo [backend] Removing Python cache files...
	for /r backend %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
	for /r backend %%f in (*.pyc) do @if exist "%%f" del /q "%%f"
	@echo Done.