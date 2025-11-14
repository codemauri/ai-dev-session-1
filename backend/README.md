# Recipe Manager Backend

FastAPI backend for the Recipe Manager application.

## Virtual Environment Setup

### Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate
```

### Install Dependencies

```bash
# Make sure virtual environment is activated
pip install -r requirements.txt
```

## Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` to configure your database connection and other settings.

## Running the Development Server

```bash
# Make sure virtual environment is activated
# Make sure PostgreSQL is running

# Run with uvicorn
uvicorn main:app --reload --port 8000

# Or run directly
python main.py
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc
- Health check: http://localhost:8000/health

## API Endpoints

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

More endpoints will be added in subsequent prompts.
