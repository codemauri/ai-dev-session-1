'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MealPlan, MealPlanCreate, MealPlanUpdate, Recipe, api } from '@/lib/api';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface MealGridData {
  [date: string]: {
    [mealType: string]: MealPlan | undefined;
  };
}

export default function MealPlansPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [notes, setNotes] = useState('');

  // Get the start of the week (Sunday) for a given date
  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  // Format date as YYYY-MM-DD
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Load meal plans for current week
  async function loadMealPlans() {
    try {
      setLoading(true);
      setError(null);

      const startDate = formatDate(currentWeekStart);
      const data = await api.mealPlans.getWeek(startDate);
      setMealPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal plans');
      console.error('Error loading meal plans:', err);
    } finally {
      setLoading(false);
    }
  }

  // Load recipes
  async function loadRecipes() {
    try {
      const data = await api.recipes.getAll();
      setRecipes(data);
    } catch (err) {
      console.error('Error loading recipes:', err);
    }
  }

  useEffect(() => {
    loadMealPlans();
    loadRecipes();
  }, [currentWeekStart]);

  // Navigate to previous/next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  // Build meal grid data structure
  const buildMealGrid = (): MealGridData => {
    const grid: MealGridData = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = formatDate(date);

      grid[dateStr] = {};
      MEAL_TYPES.forEach(mealType => {
        grid[dateStr][mealType] = undefined;
      });
    }

    // Populate with existing meal plans
    mealPlans.forEach(mp => {
      if (grid[mp.date]) {
        grid[mp.date][mp.meal_type] = mp;
      }
    });

    return grid;
  };

  const mealGrid = buildMealGrid();

  // Handle cell click (either empty or with existing meal)
  const handleCellClick = (date: string, mealType: MealType, existingMeal?: MealPlan) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);

    if (existingMeal) {
      setSelectedMealPlan(existingMeal);
      setNotes(existingMeal.notes || '');
      setShowEditModal(true);
    } else {
      setSelectedMealPlan(null);
      setNotes('');
      setShowRecipeModal(true);
    }
  };

  // Add meal plan
  const handleAddMeal = async (recipeId: number) => {
    try {
      const data: MealPlanCreate = {
        date: selectedDate,
        meal_type: selectedMealType,
        recipe_id: recipeId,
        notes: notes || undefined,
      };

      await api.mealPlans.create(data);
      await loadMealPlans();
      setShowRecipeModal(false);
      setNotes('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add meal');
    }
  };

  // Update meal plan
  const handleUpdateMeal = async (recipeId?: number) => {
    if (!selectedMealPlan) return;

    try {
      const data: MealPlanUpdate = {
        notes: notes || undefined,
      };

      if (recipeId !== undefined) {
        data.recipe_id = recipeId;
      }

      await api.mealPlans.update(selectedMealPlan.id, data);
      await loadMealPlans();
      setShowEditModal(false);
      setShowRecipeModal(false);
      setNotes('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update meal');
    }
  };

  // Delete meal plan
  const handleDeleteMeal = async () => {
    if (!selectedMealPlan) return;

    if (!confirm('Are you sure you want to delete this meal plan?')) {
      return;
    }

    try {
      await api.mealPlans.delete(selectedMealPlan.id);
      await loadMealPlans();
      setShowEditModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete meal');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading meal plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Planning</h1>
          <p className="text-gray-600 mt-2">Plan your meals for the week</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          Back to Home
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            ← Previous Week
          </button>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {' - '}
              {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <button
              onClick={goToCurrentWeek}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1"
            >
              Go to Current Week
            </button>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Meal Plan Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">
                  Meal Type
                </th>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const date = new Date(currentWeekStart);
                  date.setDate(date.getDate() + dayIndex);
                  const isToday = formatDate(date) === formatDate(new Date());

                  return (
                    <th
                      key={dayIndex}
                      className={`px-4 py-3 text-center text-sm font-semibold ${
                        isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div>{DAYS_OF_WEEK[date.getDay()]}</div>
                      <div className="text-xs font-normal mt-1">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {MEAL_TYPES.map((mealType) => (
                <tr key={mealType}>
                  <td className="px-4 py-6 text-sm font-medium text-gray-700 capitalize bg-gray-50">
                    {mealType}
                  </td>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const date = new Date(currentWeekStart);
                    date.setDate(date.getDate() + dayIndex);
                    const dateStr = formatDate(date);
                    const meal = mealGrid[dateStr]?.[mealType];
                    const isToday = dateStr === formatDate(new Date());

                    return (
                      <td
                        key={dayIndex}
                        className={`px-2 py-2 text-sm ${
                          isToday ? 'bg-blue-50' : ''
                        }`}
                      >
                        {meal ? (
                          <button
                            onClick={() => handleCellClick(dateStr, mealType, meal)}
                            className="w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left transition-colors"
                          >
                            <div className="font-medium text-green-900 text-sm line-clamp-2">
                              {meal.recipe?.title || `Recipe #${meal.recipe_id}`}
                            </div>
                            {meal.notes && (
                              <div className="text-xs text-green-700 mt-1 line-clamp-1">
                                {meal.notes}
                              </div>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCellClick(dateStr, mealType)}
                            className="w-full p-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <div className="text-gray-400 text-center text-sm">
                              + Add Meal
                            </div>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recipe Selection Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Select Recipe for {selectedMealType} on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h3>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              {recipes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recipes available.</p>
                  <Link href="/recipes" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                    Create your first recipe →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => selectedMealPlan ? handleUpdateMeal(recipe.id) : handleAddMeal(recipe.id)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="font-medium text-gray-900">{recipe.title}</div>
                      {recipe.description && (
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {recipe.description}
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {recipe.prep_time && <span>Prep: {recipe.prep_time}m</span>}
                        {recipe.cook_time && <span>Cook: {recipe.cook_time}m</span>}
                        {recipe.calories && <span>{recipe.calories} cal</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Double the recipe, meal prep"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => {
                  setShowRecipeModal(false);
                  setNotes('');
                }}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meal Modal */}
      {showEditModal && selectedMealPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedMealPlan.recipe?.title || `Recipe #${selectedMealPlan.recipe_id}`}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedMealType} on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="px-6 py-4">
              {selectedMealPlan.recipe && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Recipe Details</h4>
                  {selectedMealPlan.recipe.description && (
                    <p className="text-sm text-gray-600 mb-3">{selectedMealPlan.recipe.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    {selectedMealPlan.recipe.prep_time && <span>Prep: {selectedMealPlan.recipe.prep_time}m</span>}
                    {selectedMealPlan.recipe.cook_time && <span>Cook: {selectedMealPlan.recipe.cook_time}m</span>}
                    {selectedMealPlan.recipe.servings && <span>Servings: {selectedMealPlan.recipe.servings}</span>}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this meal..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => handleUpdateMeal()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Save Notes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShowRecipeModal(true);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Change Recipe
              </button>
              <button
                onClick={handleDeleteMeal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setNotes('');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
