'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, api, tokenManager } from '@/lib/api';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCategories();
  }, [router]);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(category.id);
      await api.categories.delete(category.id);
      // Remove from local state
      setCategories(categories.filter(c => c.id !== category.id));
    } catch (err) {
      alert('Failed to delete category: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Categories</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => loadCategories()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Categories</h1>
          <p className="text-gray-600">
            {categories.length === 0
              ? 'No categories yet. Create your first category!'
              : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`}
          </p>
        </div>
        <Link
          href="/categories/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Create Category
        </Link>
      </div>

      {categories.length === 0 ? (
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
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new category.</p>
          <div className="mt-6">
            <Link
              href="/categories/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Create Category
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-gray-600 text-sm">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/categories/${category.id}/edit`}
                    className="flex-1 px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(category)}
                    disabled={deleting === category.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-medium"
                  >
                    {deleting === category.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
