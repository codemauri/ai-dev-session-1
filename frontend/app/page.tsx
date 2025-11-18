'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Recipe, Category, api, getImageUrl, tokenManager } from '@/lib/api';
import StarRating from '@/components/StarRating';

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    setIsAuthenticated(tokenManager.isAuthenticated());
  }, []);

  // Load categories once on mount (only if authenticated)
  useEffect(() => {
    async function loadCategories() {
      // Only load categories if user is authenticated
      if (!tokenManager.isAuthenticated()) {
        return;
      }

      try {
        const categoriesData = await api.categories.getAll();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Load/search recipes with debouncing
  useEffect(() => {
    async function loadRecipes() {
      try {
        setSearching(true);
        setError(null);

        // If there's a search term, use search endpoint; otherwise list recipes
        let recipesData;
        if (searchTerm.trim()) {
          recipesData = await api.recipes.search(searchTerm.trim());
          // Filter by category if selected
          if (selectedCategory) {
            recipesData = recipesData.filter(r => r.category_id === selectedCategory);
          }
        } else {
          recipesData = await api.recipes.getAll(selectedCategory || undefined);
        }

        setRecipes(recipesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipes');
        console.error('Error loading recipes:', err);
      } finally {
        setLoading(false);
        setSearching(false);
      }
    }

    // Debounce search - wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      loadRecipes();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchTerm]);

  // No more client-side filtering - backend does it all
  const filteredRecipes = recipes;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Recipes</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show welcome banner if not authenticated and no recipes
  if (!isAuthenticated && filteredRecipes.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-16 md:py-24 text-center text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Welcome to Recipe Manager
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Organize, discover, and share your favorite recipes
              </p>
              <p className="text-lg mb-12 text-blue-50 max-w-2xl mx-auto">
                Create your personal recipe collection, plan meals, generate grocery lists, and share your culinary creations with friends and family.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition shadow-lg"
                >
                  Get Started - Sign Up
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold text-lg hover:bg-blue-600 transition border-2 border-white"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Organize Recipes</h3>
              <p className="text-gray-600">Keep all your recipes in one place with categories and tags</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Plan Meals</h3>
              <p className="text-gray-600">Create weekly meal plans and never wonder what's for dinner</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Grocery Lists</h3>
              <p className="text-gray-600">Generate shopping lists from your meal plans automatically</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">All Recipes</h1>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search Box */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search recipes (title, description, instructions, ingredients)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-64">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2">
          <p className="text-gray-600">
            {filteredRecipes.length === 0
              ? 'No recipes found. Try adjusting your filters.'
              : `${filteredRecipes.length} recipe${filteredRecipes.length === 1 ? '' : 's'} found`}
          </p>
          {searching && (
            <div className="flex items-center gap-1 text-blue-600 text-sm">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          )}
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recipes</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new recipe.</p>
          <div className="mt-6">
            <Link
              href="/recipes/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Create Recipe
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              {recipe.image_url && (
                <div className="w-full h-48 bg-gray-200">
                  <img
                    src={getImageUrl(recipe.image_url) || ''}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {recipe.title}
                </h2>
                {recipe.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                {recipe.rating && (
                  <div className="mb-3">
                    <StarRating rating={recipe.rating} size="sm" />
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {recipe.prep_time && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Prep: {recipe.prep_time}m
                    </div>
                  )}
                  {recipe.cook_time && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                      Cook: {recipe.cook_time}m
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {recipe.servings} servings
                    </div>
                  )}
                </div>
                {recipe.category && (
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                      {recipe.category.name}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
