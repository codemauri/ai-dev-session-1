from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from pathlib import Path

# Import routers
from routers import recipes, categories, grocery_list, meal_plans
from database import get_db
import models
import schemas

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Recipe Manager API",
    description="API for managing recipes, ingredients, and categories",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(recipes.router)
app.include_router(categories.router)
app.include_router(grocery_list.router)
app.include_router(meal_plans.router)

# Public recipe sharing endpoint (no auth required)
@app.get("/api/share/{share_token}", response_model=schemas.Recipe)
def get_shared_recipe(
    share_token: str,
    db: Session = Depends(get_db)
):
    """
    Get a publicly shared recipe by its share token
    No authentication required
    """
    recipe = db.query(models.Recipe).filter(
        models.Recipe.share_token == share_token,
        models.Recipe.is_public == True
    ).first()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared recipe not found or is not public"
        )

    return recipe

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "recipe-manager-api"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Recipe Manager API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
