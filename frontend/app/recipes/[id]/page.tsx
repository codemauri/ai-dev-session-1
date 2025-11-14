'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Recipe, api, getImageUrl } from '@/lib/api';
import StarRating from '@/components/StarRating';
import ShareModal from '@/components/ShareModal';

export default function RecipeDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [recipeId, setRecipeId] = useState<string | null>(null);

  // Unwrap params promise
  useEffect(() => {
    params.then(p => setRecipeId(p.id));
  }, [params]);

  useEffect(() => {
    if (!recipeId) return;

    async function loadRecipe() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.recipes.getById(parseInt(recipeId));
        setRecipe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipe');
        console.error('Error loading recipe:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [recipeId]);

  const handleDelete = async () => {
    if (!recipe || !confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      setDeleting(true);
      await api.recipes.delete(recipe.id);
      router.push('/');
    } catch (err) {
      alert('Failed to delete recipe: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      const updatedRecipe = await api.recipes.share(recipe.id);
      setRecipe(updatedRecipe);
    } catch (err) {
      alert('Failed to share recipe: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUnshare = async () => {
    if (!recipe) return;
    try {
      const updatedRecipe = await api.recipes.unshare(recipe.id);
      setRecipe(updatedRecipe);
    } catch (err) {
      alert('Failed to unshare recipe: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Recipe Not Found</h2>
          <p className="text-red-600">{error || 'The recipe you are looking for does not exist.'}</p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Recipes
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
              <div className="flex items-center gap-4">
                {recipe.category && (
                  <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {recipe.category.name}
                  </span>
                )}
                {recipe.rating && (
                  <div className="mt-1">
                    <StarRating rating={recipe.rating} size="md" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/recipes/${recipe.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit
              </Link>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Share
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Image */}
        {recipe.image_url && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <img
              src={getImageUrl(recipe.image_url) || ''}
              alt={recipe.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Recipe Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {recipe.description && (
            <p className="text-gray-700 text-lg mb-6">{recipe.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {recipe.prep_time && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{recipe.prep_time}m</div>
                <div className="text-sm text-gray-600">Prep Time</div>
              </div>
            )}
            {recipe.cook_time && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{recipe.cook_time}m</div>
                <div className="text-sm text-gray-600">Cook Time</div>
              </div>
            )}
            {totalTime > 0 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalTime}m</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
            )}
            {recipe.servings && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{recipe.servings}</div>
                <div className="text-sm text-gray-600">Servings</div>
              </div>
            )}
          </div>
        </div>

        {/* Nutritional Information */}
        {(recipe.calories || recipe.protein || recipe.carbohydrates || recipe.fat) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nutritional Information</h2>
            <p className="text-sm text-gray-600 mb-4">Per Serving</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recipe.calories !== null && recipe.calories !== undefined && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{recipe.calories}</div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
              )}
              {recipe.protein !== null && recipe.protein !== undefined && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{recipe.protein}g</div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
              )}
              {recipe.carbohydrates !== null && recipe.carbohydrates !== undefined && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{recipe.carbohydrates}g</div>
                  <div className="text-sm text-gray-600">Carbs</div>
                </div>
              )}
              {recipe.fat !== null && recipe.fat !== undefined && (
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{recipe.fat}g</div>
                  <div className="text-sm text-gray-600">Fat</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    <span className="font-medium">{ingredient.amount} {ingredient.unit}</span> {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{recipe.instructions}</p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>Created: {new Date(recipe.created_at).toLocaleDateString()}</p>
          {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
            <p>Last updated: {new Date(recipe.updated_at).toLocaleDateString()}</p>
          )}
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          shareToken={recipe.share_token}
          isPublic={recipe.is_public}
          onShare={handleShare}
          onUnshare={handleUnshare}
        />
      </div>
    </div>
  );
}
