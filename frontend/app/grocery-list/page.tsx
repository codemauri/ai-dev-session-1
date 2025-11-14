'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Recipe, GroceryListResponse, api } from '@/lib/api';

export default function GroceryListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryListResponse | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipes() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.recipes.getAll();
        setRecipes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipes');
        console.error('Error loading recipes:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, []);

  const handleRecipeToggle = (recipeId: number) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecipeIds.length === recipes.length) {
      setSelectedRecipeIds([]);
    } else {
      setSelectedRecipeIds(recipes.map((r) => r.id));
    }
  };

  const handleGenerateList = async () => {
    if (selectedRecipeIds.length === 0) {
      alert('Please select at least one recipe');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const data = await api.groceryList.generate(selectedRecipeIds);
      setGroceryList(data);
      setCheckedItems(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate grocery list');
      console.error('Error generating grocery list:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleItemToggle = (index: number) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setGroceryList(null);
    setSelectedRecipeIds([]);
    setCheckedItems(new Set());
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Grocery List Generator</h1>
        <p className="text-gray-600 mb-8">
          Select recipes to generate a combined shopping list with all ingredients
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!groceryList ? (
          // Recipe Selection View
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Recipes</h2>
              <button
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedRecipeIds.length === recipes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {recipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No recipes found</p>
                <Link
                  href="/recipes/new"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {recipes.map((recipe) => (
                    <label
                      key={recipe.id}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipeIds.includes(recipe.id)}
                        onChange={() => handleRecipeToggle(recipe.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium text-gray-900">{recipe.title}</h3>
                        {recipe.category && (
                          <span className="text-sm text-gray-500">{recipe.category.name}</span>
                        )}
                      </div>
                      {recipe.ingredients && (
                        <span className="text-sm text-gray-500">
                          {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-gray-600">
                    {selectedRecipeIds.length} recipe{selectedRecipeIds.length !== 1 ? 's' : ''} selected
                  </p>
                  <button
                    onClick={handleGenerateList}
                    disabled={selectedRecipeIds.length === 0 || generating}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {generating ? 'Generating...' : 'Generate Grocery List'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // Grocery List Display View
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Grocery List</h2>
                <p className="text-gray-600">
                  {groceryList.total_items} item{groceryList.total_items !== 1 ? 's' : ''} from{' '}
                  {groceryList.recipe_count} recipe{groceryList.recipe_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition print:hidden"
                >
                  Print
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition print:hidden"
                >
                  New List
                </button>
              </div>
            </div>

            {/* Selected Recipes */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg print:bg-white print:border print:border-gray-300">
              <h3 className="font-medium text-gray-900 mb-2">Recipes:</h3>
              <div className="flex flex-wrap gap-2">
                {groceryList.recipe_titles.map((title, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-blue-200"
                  >
                    {title}
                  </span>
                ))}
              </div>
            </div>

            {/* Grocery Items */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 mb-4">Shopping List:</h3>
              {groceryList.items.map((item, index) => (
                <label
                  key={index}
                  className={`flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition ${
                    checkedItems.has(index) ? 'bg-gray-50 opacity-60' : 'bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checkedItems.has(index)}
                    onChange={() => handleItemToggle(index)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 print:hidden"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`font-medium ${
                          checkedItems.has(index) ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="text-gray-600">
                        {item.amount} {item.unit}
                      </span>
                    </div>
                    {item.recipe_count > 1 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Used in {item.recipe_count} recipes: {item.recipes.join(', ')}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Progress */}
            <div className="mt-6 pt-4 border-t print:hidden">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {checkedItems.size} of {groceryList.total_items} items checked
                </span>
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(checkedItems.size / groceryList.total_items) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
