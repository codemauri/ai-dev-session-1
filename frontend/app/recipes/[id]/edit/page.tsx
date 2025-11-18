'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, IngredientCreate, RecipeUpdate, Recipe, api } from '@/lib/api';
import StarRating from '@/components/StarRating';

export default function EditRecipe({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipeId, setRecipeId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [servings, setServings] = useState<number | ''>('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbohydrates, setCarbohydrates] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [rating, setRating] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [ingredients, setIngredients] = useState<IngredientCreate[]>([
    { name: '', amount: '', unit: '' }
  ]);

  // Unwrap params promise
  useEffect(() => {
    params.then(p => setRecipeId(p.id));
  }, [params]);

  // Load recipe data and categories
  useEffect(() => {
    if (!recipeId) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        if (!recipeId) return;

        // Load recipe and categories in parallel
        const [recipeData, categoriesData] = await Promise.all([
          api.recipes.getById(parseInt(recipeId)),
          api.categories.getAll()
        ]);

        // Populate form with recipe data
        setTitle(recipeData.title);
        setDescription(recipeData.description || '');
        setInstructions(recipeData.instructions || '');
        setPrepTime(recipeData.prep_time || '');
        setCookTime(recipeData.cook_time || '');
        setServings(recipeData.servings || '');
        setCalories(recipeData.calories || '');
        setProtein(recipeData.protein || '');
        setCarbohydrates(recipeData.carbohydrates || '');
        setFat(recipeData.fat || '');
        setRating(recipeData.rating || null);
        setImageUrl(recipeData.image_url || '');
        setCategoryId(recipeData.category_id || '');

        // Set ingredients or default to one empty ingredient
        if (recipeData.ingredients && recipeData.ingredients.length > 0) {
          setIngredients(recipeData.ingredients.map(ing => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit
          })));
        }

        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipe');
        console.error('Error loading recipe:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [recipeId]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientCreate, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Recipe title is required');
      return;
    }

    // Filter out empty ingredients
    const validIngredients = ingredients.filter(
      ing => ing.name.trim() && ing.amount.trim() && ing.unit.trim()
    );

    const recipeData: RecipeUpdate = {
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      prep_time: prepTime || undefined,
      cook_time: cookTime || undefined,
      servings: servings || undefined,
      calories: calories || undefined,
      protein: protein || undefined,
      carbohydrates: carbohydrates || undefined,
      fat: fat || undefined,
      rating: rating || undefined,
      // If uploading a file, clear the URL first (will be set by upload)
      // Otherwise, use the current URL value
      image_url: imageFile ? '' : (imageUrl.trim() || undefined),
      category_id: categoryId || undefined,
      ingredients: validIngredients,
    };

    if (!recipeId) return;

    try {
      setSaving(true);
      setError(null);

      // Update the recipe first
      const updatedRecipe = await api.recipes.update(parseInt(recipeId), recipeData);

      // If user selected a file to upload, upload it
      if (imageFile) {
        try {
          await api.recipes.uploadImage(parseInt(recipeId), imageFile);
          // Upload succeeded, navigate to recipe detail
          router.push(`/recipes/${updatedRecipe.id}`);
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          setError('Recipe updated, but image upload failed: ' + (uploadErr instanceof Error ? uploadErr.message : 'Unknown error'));
          setSaving(false);
          // Don't redirect, let user try again
          return;
        }
      } else {
        // No file to upload, just navigate
        router.push(`/recipes/${updatedRecipe.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
      setSaving(false);
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

  if (error && !title) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Recipe</h2>
          <p className="text-red-600">{error}</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/recipes/${recipeId}`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Recipe
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Edit Recipe</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Spaghetti Carbonara"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the recipe"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    id="prepTime"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : '')}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Cook Time (min)
                  </label>
                  <input
                    type="number"
                    id="cookTime"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value) : '')}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    id="servings"
                    value={servings}
                    onChange={(e) => setServings(e.target.value ? parseInt(e.target.value) : '')}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (Optional)
                </label>
                <StarRating
                  rating={rating}
                  editable={true}
                  onChange={setRating}
                  size="lg"
                />
              </div>

              {/* Image URL */}
              <div className="mt-4">
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/recipe-image.jpg"
                />
                <p className="mt-1 text-sm text-gray-500">Enter a URL to an image for this recipe</p>
              </div>

              {/* OR separator */}
              <div className="mt-4 text-center text-gray-500 text-sm font-medium">
                — OR —
              </div>

              {/* Image Upload */}
              <div className="mt-4">
                <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image (Optional)
                </label>
                <input
                  type="file"
                  id="imageFile"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (5MB max)
                      if (file.size > 5 * 1024 * 1024) {
                        setError('Image file too large. Maximum size is 5MB.');
                        e.target.value = '';
                        return;
                      }
                      setImageFile(file);
                      // Clear the URL field when uploading a file
                      setImageUrl('');
                      setError(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload an image from your computer (JPG, PNG, GIF, WebP - max 5MB)
                </p>
                {imageFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nutritional Information (Per Serving)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
                  Calories
                </label>
                <input
                  type="number"
                  id="calories"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value ? parseInt(e.target.value) : '')}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  id="protein"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value ? parseFloat(e.target.value) : '')}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label htmlFor="carbohydrates" className="block text-sm font-medium text-gray-700 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  id="carbohydrates"
                  value={carbohydrates}
                  onChange={(e) => setCarbohydrates(e.target.value ? parseFloat(e.target.value) : '')}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  id="fat"
                  value={fat}
                  onChange={(e) => setFat(e.target.value ? parseFloat(e.target.value) : '')}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
              <button
                type="button"
                onClick={addIngredient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                + Add Ingredient
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingredient name"
                  />
                  <input
                    type="text"
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Amount"
                  />
                  <input
                    type="text"
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Unit"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Step-by-step instructions for preparing the recipe..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <Link
              href={`/recipes/${recipeId}`}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
