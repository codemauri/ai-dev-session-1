import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GroceryListPage from '../page';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    recipes: {
      getAll: jest.fn(),
    },
    groceryList: {
      generate: jest.fn(),
    },
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('GroceryListPage', () => {
  const mockRecipes = [
    {
      id: 1,
      title: 'Pancakes',
      description: 'Fluffy pancakes',
      instructions: 'Mix and cook',
      prep_time: 10,
      cook_time: 15,
      servings: 4,
      calories: 280,
      protein: 8.0,
      carbohydrates: 45.0,
      fat: 8.0,
      rating: null,
      image_url: null,
      is_public: false,
      share_token: null,
      category_id: 1,
      category: {
        id: 1,
        name: 'Breakfast',
        description: null,
      },
      ingredients: [
        { id: 1, recipe_id: 1, name: 'Flour', amount: '2', unit: 'cups' },
        { id: 2, recipe_id: 1, name: 'Milk', amount: '1 1/2', unit: 'cups' },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      title: 'Scrambled Eggs',
      description: 'Quick eggs',
      instructions: 'Scramble eggs',
      prep_time: 5,
      cook_time: 5,
      servings: 2,
      calories: 220,
      protein: 18.5,
      carbohydrates: 3.0,
      fat: 15.0,
      rating: 5.0,
      image_url: null,
      is_public: false,
      share_token: null,
      category_id: 1,
      category: {
        id: 1,
        name: 'Breakfast',
        description: null,
      },
      ingredients: [
        { id: 3, recipe_id: 2, name: 'Eggs', amount: '4', unit: 'whole' },
        { id: 4, recipe_id: 2, name: 'Butter', amount: '1', unit: 'tbsp' },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockGroceryList = {
    items: [
      {
        name: 'Flour',
        amount: '2',
        unit: 'cups',
        recipe_count: 1,
        recipes: ['Pancakes'],
      },
      {
        name: 'Milk',
        amount: '1 1/2',
        unit: 'cups',
        recipe_count: 1,
        recipes: ['Pancakes'],
      },
      {
        name: 'Eggs',
        amount: '4',
        unit: 'whole',
        recipe_count: 1,
        recipes: ['Scrambled Eggs'],
      },
      {
        name: 'Butter',
        amount: '1',
        unit: 'tbsp',
        recipe_count: 1,
        recipes: ['Scrambled Eggs'],
      },
    ],
    total_items: 4,
    recipe_count: 2,
    recipe_titles: ['Pancakes', 'Scrambled Eggs'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Loading State Tests
  describe('Loading State', () => {
    it('should show loading spinner while fetching recipes', () => {
      (api.recipes.getAll as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<GroceryListPage />);

      expect(screen.getByText('Loading recipes...')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // Recipe Selection Tests
  describe('Recipe Selection', () => {
    beforeEach(() => {
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
    });

    it('should display list of recipes for selection', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument();
      });
    });

    it('should allow selecting individual recipes', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      expect(screen.getByText('1 recipe selected')).toBeInTheDocument();
    });

    it('should allow selecting multiple recipes', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select Pancakes
      fireEvent.click(checkboxes[1]); // Select Scrambled Eggs

      expect(screen.getByText('2 recipes selected')).toBeInTheDocument();
    });

    it('should show select all button', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });
    });

    it('should select all recipes when clicking select all', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(screen.getByText('2 recipes selected')).toBeInTheDocument();
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    it('should display ingredient count for each recipe', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Check that ingredient counts are displayed
      const ingredientTexts = screen.getAllByText(/ingredient/i);
      expect(ingredientTexts.length).toBeGreaterThan(0);
    });
  });

  // Grocery List Generation Tests
  describe('Grocery List Generation', () => {
    beforeEach(() => {
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.groceryList.generate as jest.Mock).mockResolvedValue(mockGroceryList);
    });

    it('should generate grocery list when button clicked', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Select recipes
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      // Click generate button
      const generateButton = screen.getByText('Generate Grocery List');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(api.groceryList.generate).toHaveBeenCalledWith([1, 2]);
      });
    });

    it('should display grocery list after generation', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Select and generate
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      const generateButton = screen.getByText('Generate Grocery List');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Your Grocery List')).toBeInTheDocument();
        expect(screen.getByText('4 items from 2 recipes')).toBeInTheDocument();
      });
    });

    it('should display all grocery items', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      const generateButton = screen.getByText('Generate Grocery List');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Flour')).toBeInTheDocument();
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Eggs')).toBeInTheDocument();
        expect(screen.getByText('Butter')).toBeInTheDocument();
      });
    });

    it('should disable generate button when no recipes selected', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const generateButton = screen.getByText('Generate Grocery List');
      expect(generateButton).toBeDisabled();
    });
  });

  // Grocery List Display Tests
  describe('Grocery List Display', () => {
    beforeEach(async () => {
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.groceryList.generate as jest.Mock).mockResolvedValue(mockGroceryList);
    });

    it('should allow checking off items', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      const generateButton = screen.getByText('Generate Grocery List');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Flour')).toBeInTheDocument();
      });

      // Check off an item
      const itemCheckboxes = screen.getAllByRole('checkbox');
      fireEvent.click(itemCheckboxes[0]);

      expect(screen.getByText('1 of 4 items checked')).toBeInTheDocument();
    });

    it('should show print button', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      const generateButton = screen.getByText('Generate Grocery List');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
    });

    it('should show new list button', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      const generateButton = screen.getByText('Generate Grocery List');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('New List')).toBeInTheDocument();
      });
    });

    it('should reset to recipe selection when clicking new list', async () => {
      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      let generateButton = screen.getByText('Generate Grocery List');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('New List')).toBeInTheDocument();
      });

      const newListButton = screen.getByText('New List');
      fireEvent.click(newListButton);

      expect(screen.getByText('Select Recipes')).toBeInTheDocument();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should display error when API fails', async () => {
      (api.recipes.getAll as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('should display error when grocery list generation fails', async () => {
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.groceryList.generate as jest.Mock).mockRejectedValue(new Error('Generation failed'));

      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      const generateButton = screen.getByText('Generate Grocery List');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
      });
    });
  });

  // Empty State Tests
  describe('Empty State', () => {
    it('should show message when no recipes exist', async () => {
      (api.recipes.getAll as jest.Mock).mockResolvedValue([]);

      render(<GroceryListPage />);

      await waitFor(() => {
        expect(screen.getByText('No recipes found')).toBeInTheDocument();
        expect(screen.getByText('Create Your First Recipe')).toBeInTheDocument();
      });
    });
  });
});
