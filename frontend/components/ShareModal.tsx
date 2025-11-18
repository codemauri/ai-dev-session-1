'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: number;
  recipeTitle: string;
  shareToken: string | null;
  isPublic: boolean;
  onShare: () => Promise<void>;
  onUnshare: () => Promise<void>;
}

export default function ShareModal({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
  shareToken,
  isPublic,
  onShare,
  onUnshare
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [loadingShare, setLoadingShare] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const [currentShareToken, setCurrentShareToken] = useState(shareToken);

  // Update local state when props change (after parent refreshes recipe)
  useEffect(() => {
    setCurrentIsPublic(isPublic);
    setCurrentShareToken(shareToken);
  }, [isPublic, shareToken]);

  if (!isOpen) return null;

  const shareUrl = currentShareToken
    ? `${window.location.origin}/share/${currentShareToken}`
    : '';

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleToggleShareLink = async () => {
    setLoadingShare(true);
    try {
      if (currentShareToken) {
        // Revoke share link
        await onUnshare();
        setCurrentShareToken(null);
      } else {
        // Generate share link
        await onShare();
        // onShare will refresh the recipe, so we need to wait for parent to update
        // For now, the parent will trigger a re-render with new shareToken
      }
    } finally {
      setLoadingShare(false);
    }
  };

  const handleTogglePublic = async () => {
    setLoadingPublic(true);
    try {
      // Fetch current recipe to get all required fields
      const recipe = await api.recipes.getById(recipeId);

      // Update with all required fields + toggled is_public
      await api.recipes.update(recipeId, {
        title: recipe.title,
        instructions: recipe.instructions || undefined,
        description: recipe.description || undefined,
        prep_time: recipe.prep_time || undefined,
        cook_time: recipe.cook_time || undefined,
        servings: recipe.servings || undefined,
        category_id: recipe.category_id || undefined,
        is_public: !currentIsPublic,
      });
      setCurrentIsPublic(!currentIsPublic);
    } catch (error) {
      console.error('Failed to update recipe visibility:', error);
      alert('Failed to update recipe visibility: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoadingPublic(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recipe Visibility</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Control who can see &quot;{recipeTitle}&quot;
        </p>

        {/* Share Link Toggle */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900">
                Share Link
              </p>
              <p className="text-sm text-gray-600">
                {currentShareToken
                  ? 'Anyone with the link can view (even if private)'
                  : 'Generate a link to share this recipe'}
              </p>
            </div>
            <button
              onClick={handleToggleShareLink}
              disabled={loadingShare}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                currentShareToken ? 'bg-blue-600' : 'bg-gray-200'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentShareToken ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Share Link Display */}
          {currentShareToken && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                >
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    'Copy'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Public/Private Toggle */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {currentIsPublic ? 'Public' : 'Private'}
              </p>
              <p className="text-sm text-gray-600">
                {currentIsPublic
                  ? 'Visible in search results and recipe lists'
                  : 'Only visible to you (and via share link)'}
              </p>
            </div>
            <button
              onClick={handleTogglePublic}
              disabled={loadingPublic}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                currentIsPublic ? 'bg-green-600' : 'bg-gray-200'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentIsPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
