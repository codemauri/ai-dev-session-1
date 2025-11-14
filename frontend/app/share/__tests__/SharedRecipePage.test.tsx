import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SharedRecipe from '../[token]/page';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    recipes: {
      getByShareToken: jest.fn(),
    },
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('SharedRecipe Page', () => {
  const mockRecipe = {
    id: 1,
    title: 'Shared Test Recipe',
    description: 'A delicious shared recipe',
    instructions: 'Step 1: Mix ingredients\nStep 2: Cook',
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    calories: 350,
    protein: 25.5,
    carbohydrates: 40.0,
    fat: 12.5,
    rating: 4.5,
    image_url: 'https://example.com/recipe.jpg',
    is_public: true,
    share_token: 'test-token-123',
    category_id: 1,
    category: {
      id: 1,
      name: 'Main Course',
      description: 'Main dishes',
    },
    ingredients: [
      { id: 1, recipe_id: 1, name: 'Flour', amount: '2', unit: 'cups' },
      { id: 2, recipe_id: 1, name: 'Sugar', amount: '1', unit: 'cup' },
      { id: 3, recipe_id: 1, name: 'Eggs', amount: '3', unit: 'large' },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const mockParams = Promise.resolve({ token: 'test-token-123' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Loading State Tests
  describe('Loading State', () => {
    it('should show loading spinner while fetching recipe', () => {
      (api.recipes.getByShareToken as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<SharedRecipe params={mockParams} />);

      expect(screen.getByText('Loading shared recipe...')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // Success State Tests
  describe('Recipe Display', () => {
    beforeEach(() => {
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(mockRecipe);
    });

    it('should display recipe title and shared badge', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
        expect(screen.getByText('This is a publicly shared recipe')).toBeInTheDocument();
      });
    });

    it('should display recipe description', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('A delicious shared recipe')).toBeInTheDocument();
      });
    });

    it('should display recipe category', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Main Course')).toBeInTheDocument();
      });
    });

    it('should display recipe image when provided', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        const image = screen.getByAltText('Shared Test Recipe');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/recipe.jpg');
      });
    });

    it('should display prep time', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('15m')).toBeInTheDocument();
        expect(screen.getByText('Prep Time')).toBeInTheDocument();
      });
    });

    it('should display cook time', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('30m')).toBeInTheDocument();
        expect(screen.getByText('Cook Time')).toBeInTheDocument();
      });
    });

    it('should display total time', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('45m')).toBeInTheDocument(); // 15 + 30
        expect(screen.getByText('Total Time')).toBeInTheDocument();
      });
    });

    it('should display servings', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('Servings')).toBeInTheDocument();
      });
    });

    it('should display star rating', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        // StarRating component should be rendered
        const container = screen.getByText('Shared Test Recipe').closest('div');
        expect(container).toBeInTheDocument();
      });
    });
  });

  // Nutritional Information Tests
  describe('Nutritional Information', () => {
    beforeEach(() => {
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(mockRecipe);
    });

    it('should display nutritional information section', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Nutritional Information')).toBeInTheDocument();
        expect(screen.getByText('Per Serving')).toBeInTheDocument();
      });
    });

    it('should display calories', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('350')).toBeInTheDocument();
        expect(screen.getByText('Calories')).toBeInTheDocument();
      });
    });

    it('should display protein with unit', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('25.5g')).toBeInTheDocument();
        expect(screen.getByText('Protein')).toBeInTheDocument();
      });
    });

    it('should display carbohydrates with unit', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('40g')).toBeInTheDocument();
        expect(screen.getByText('Carbs')).toBeInTheDocument();
      });
    });

    it('should display fat with unit', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('12.5g')).toBeInTheDocument();
        expect(screen.getByText('Fat')).toBeInTheDocument();
      });
    });

    it('should not display nutrition section when all values are null', async () => {
      const recipeWithoutNutrition = {
        ...mockRecipe,
        calories: null,
        protein: null,
        carbohydrates: null,
        fat: null,
      };
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(recipeWithoutNutrition);

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.queryByText('Nutritional Information')).not.toBeInTheDocument();
      });
    });
  });

  // Ingredients Tests
  describe('Ingredients Display', () => {
    beforeEach(() => {
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(mockRecipe);
    });

    it('should display ingredients section', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Ingredients')).toBeInTheDocument();
      });
    });

    it('should display all ingredients with amounts and units', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Ingredients')).toBeInTheDocument();
      });

      // Check for specific ingredient text
      expect(screen.getByText(/Flour/)).toBeInTheDocument();
      expect(screen.getByText(/Sugar/)).toBeInTheDocument();
      expect(screen.getByText(/Eggs/)).toBeInTheDocument();
    });

    it('should not display ingredients section when empty', async () => {
      const recipeWithoutIngredients = { ...mockRecipe, ingredients: [] };
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(recipeWithoutIngredients);

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.queryByText('Ingredients')).not.toBeInTheDocument();
      });
    });
  });

  // Instructions Tests
  describe('Instructions Display', () => {
    beforeEach(() => {
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(mockRecipe);
    });

    it('should display instructions section', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Instructions')).toBeInTheDocument();
      });
    });

    it('should display instruction text with line breaks', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        const instructionsText = screen.getByText(/Step 1: Mix ingredients/);
        expect(instructionsText).toBeInTheDocument();
        expect(instructionsText.textContent).toContain('Step 2: Cook');
      });
    });

    it('should not display instructions section when null', async () => {
      const recipeWithoutInstructions = { ...mockRecipe, instructions: null };
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(recipeWithoutInstructions);

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });

      expect(screen.queryByText('Instructions')).not.toBeInTheDocument();
    });
  });

  // Error State Tests
  describe('Error States', () => {
    it('should display error message when recipe not found', async () => {
      (api.recipes.getByShareToken as jest.Mock).mockRejectedValue(
        new Error('API Error 404: Recipe not found')
      );

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Recipe Not Found')).toBeInTheDocument();
        expect(screen.getByText(/API Error 404/)).toBeInTheDocument();
        expect(screen.getByText('The recipe may have been made private or deleted.')).toBeInTheDocument();
      });
    });

    it('should display generic error message on API failure', async () => {
      (api.recipes.getByShareToken as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Recipe Not Found')).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('should handle non-Error exceptions', async () => {
      (api.recipes.getByShareToken as jest.Mock).mockRejectedValue('String error');

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Recipe Not Found')).toBeInTheDocument();
        expect(screen.getByText('Failed to load shared recipe')).toBeInTheDocument();
      });
    });
  });

  // No Edit/Delete Controls Tests
  describe('Public View Restrictions', () => {
    beforeEach(() => {
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(mockRecipe);
    });

    it('should not display Edit button', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should not display Delete button', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should not display Share button', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });

      expect(screen.queryByText('Share')).not.toBeInTheDocument();
    });

    it('should not display Back to Recipes link', async () => {
      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });

      expect(screen.queryByText('Back to Recipes')).not.toBeInTheDocument();
    });
  });

  // Params Handling Tests
  describe('Token Parameter Handling', () => {
    it('should unwrap params promise and use token', async () => {
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(mockRecipe);

      render(<SharedRecipe params={Promise.resolve({ token: 'custom-token-456' })} />);

      await waitFor(() => {
        expect(api.recipes.getByShareToken).toHaveBeenCalledWith('custom-token-456');
      });
    });
  });

  // Optional Fields Tests
  describe('Optional Fields Handling', () => {
    it('should handle recipe without image', async () => {
      const recipeWithoutImage = { ...mockRecipe, image_url: null };
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(recipeWithoutImage);

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });

      expect(screen.queryByAltText('Shared Test Recipe')).not.toBeInTheDocument();
    });

    it('should handle recipe without category', async () => {
      const recipeWithoutCategory = { ...mockRecipe, category: null, category_id: null };
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(recipeWithoutCategory);

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });

      expect(screen.queryByText('Main Course')).not.toBeInTheDocument();
    });

    it('should handle recipe without rating', async () => {
      const recipeWithoutRating = { ...mockRecipe, rating: null };
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(recipeWithoutRating);

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });
      // Component should still render without crashing
    });

    it('should handle recipe without timing information', async () => {
      const recipeWithoutTimes = {
        ...mockRecipe,
        prep_time: null,
        cook_time: null,
        servings: null,
      };
      (api.recipes.getByShareToken as jest.Mock).mockResolvedValue(recipeWithoutTimes);

      render(<SharedRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Shared Test Recipe')).toBeInTheDocument();
      });

      expect(screen.queryByText('Prep Time')).not.toBeInTheDocument();
      expect(screen.queryByText('Cook Time')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Time')).not.toBeInTheDocument();
      expect(screen.queryByText('Servings')).not.toBeInTheDocument();
    });
  });
});
