import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    recipes: {
      getAll: jest.fn(),
      search: jest.fn(),
    },
    categories: {
      getAll: jest.fn(),
    },
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock StarRating component
jest.mock('@/components/StarRating', () => {
  return function MockStarRating({ rating }: { rating: number }) {
    return <div data-testid="star-rating">Rating: {rating}</div>;
  };
});

describe('HomePage - Full-Text Search', () => {
  const mockCategories = [
    { id: 1, name: 'Breakfast', description: 'Morning meals' },
    { id: 2, name: 'Lunch', description: 'Midday meals' },
  ];

  const mockRecipes = [
    {
      id: 1,
      title: 'Pancakes',
      description: 'Fluffy breakfast pancakes',
      instructions: 'Mix and cook',
      prep_time: 10,
      cook_time: 15,
      servings: 4,
      calories: 280,
      protein: 8.0,
      carbohydrates: 45.0,
      fat: 8.0,
      rating: 4.5,
      image_url: null,
      is_public: false,
      share_token: null,
      category_id: 1,
      category: mockCategories[0],
      ingredients: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      title: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta',
      instructions: 'Cook pasta, add sauce',
      prep_time: 5,
      cook_time: 20,
      servings: 2,
      calories: 450,
      protein: 15.0,
      carbohydrates: 60.0,
      fat: 18.0,
      rating: 5.0,
      image_url: null,
      is_public: false,
      share_token: null,
      category_id: 2,
      category: mockCategories[1],
      ingredients: [],
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (api.categories.getAll as jest.Mock).mockResolvedValue(mockCategories);
    (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
    (api.recipes.search as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Load', () => {
    it('should load all recipes when no search term', async () => {
      render(<Home />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      // Should call getAll, not search
      expect(api.recipes.getAll).toHaveBeenCalled();
      expect(api.recipes.search).not.toHaveBeenCalled();

      // Should display recipes
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should call search API when user types in search box', async () => {
      const searchResults = [mockRecipes[0]]; // Only Pancakes
      (api.recipes.search as jest.Mock).mockResolvedValue(searchResults);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      // Type in search box
      const searchInput = screen.getByPlaceholderText(/Search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'pancakes' } });

      // Fast-forward debounce timer (300ms)
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(api.recipes.search).toHaveBeenCalledWith('pancakes');
      });

      // Should show search results
      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
        expect(screen.queryByText('Spaghetti Carbonara')).not.toBeInTheDocument();
      });
    });

    it('should debounce search calls (300ms delay)', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search recipes/i);

      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 'p' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(searchInput, { target: { value: 'pa' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(searchInput, { target: { value: 'pan' } });
      jest.advanceTimersByTime(100);

      // Should not have called search yet (only 300ms total, but keeps resetting)
      expect(api.recipes.search).not.toHaveBeenCalled();

      // Now wait the full 300ms
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(api.recipes.search).toHaveBeenCalledTimes(1);
        expect(api.recipes.search).toHaveBeenCalledWith('pan');
      });
    });

    it('should trim whitespace from search query', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search recipes/i);
      fireEvent.change(searchInput, { target: { value: '  pasta  ' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(api.recipes.search).toHaveBeenCalledWith('pasta');
      });
    });

    it('should revert to getAll when search is cleared', async () => {
      (api.recipes.search as jest.Mock).mockResolvedValue([mockRecipes[0]]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search recipes/i);

      // First, do a search
      fireEvent.change(searchInput, { target: { value: 'pancakes' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(api.recipes.search).toHaveBeenCalledWith('pancakes');
      });

      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(api.recipes.getAll).toHaveBeenCalled();
      });
    });

    it('should display "No recipes found" when search returns empty', async () => {
      (api.recipes.search as jest.Mock).mockResolvedValue([]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/No recipes found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search + Category Filter Combination', () => {
    it('should apply category filter to search results', async () => {
      const searchResults = mockRecipes; // Both recipes
      (api.recipes.search as jest.Mock).mockResolvedValue(searchResults);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      // Select a category first
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '1' } }); // Breakfast

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(api.recipes.getAll).toHaveBeenCalledWith(1);
      });

      // Now search
      const searchInput = screen.getByPlaceholderText(/Search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'recipe' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(api.recipes.search).toHaveBeenCalledWith('recipe');
      });

      // Should only show Breakfast category recipe (Pancakes)
      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
        expect(screen.queryByText('Spaghetti Carbonara')).not.toBeInTheDocument();
      });
    });

    it('should clear both search and category filters together', async () => {
      (api.recipes.search as jest.Mock).mockResolvedValue([mockRecipes[0]]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      // Set category
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '1' } });
      jest.advanceTimersByTime(300);

      // Set search
      const searchInput = screen.getByPlaceholderText(/Search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'pancakes' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/Clear Filters/i)).toBeInTheDocument();
      });

      // Click Clear Filters
      const clearButton = screen.getByText(/Clear Filters/i);
      fireEvent.click(clearButton);

      jest.advanceTimersByTime(300);

      // Should revert to showing all recipes
      await waitFor(() => {
        expect(api.recipes.getAll).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Search Results Display', () => {
    it('should display recipe count for search results', async () => {
      const searchResults = [mockRecipes[0], mockRecipes[1]];
      (api.recipes.search as jest.Mock).mockResolvedValue(searchResults);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'recipe' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/2 recipes found/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during search', async () => {
      let resolveSearch: any;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      (api.recipes.search as jest.Mock).mockReturnValue(searchPromise);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/Loading recipes/i)).toBeInTheDocument();
      });

      // Resolve the search
      resolveSearch([mockRecipes[0]]);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Error Handling', () => {
    it('should display error message when search fails', async () => {
      (api.recipes.search as jest.Mock).mockRejectedValue(
        new Error('Search failed')
      );

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search recipes/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Recipes/i)).toBeInTheDocument();
        expect(screen.getByText(/Search failed/i)).toBeInTheDocument();
      });
    });
  });
});
