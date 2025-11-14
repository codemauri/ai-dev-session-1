import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MealPlansPage from '../page';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    recipes: {
      getAll: jest.fn(),
    },
    mealPlans: {
      getWeek: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('MealPlansPage', () => {
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
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      title: 'Grilled Chicken',
      description: 'Healthy grilled chicken',
      instructions: 'Grill until done',
      prep_time: 5,
      cook_time: 20,
      servings: 2,
      calories: 220,
      protein: 30.0,
      carbohydrates: 0.0,
      fat: 10.0,
      rating: 4.5,
      image_url: null,
      is_public: false,
      share_token: null,
      category_id: 2,
      category: {
        id: 2,
        name: 'Lunch',
        description: null,
      },
      ingredients: [
        { id: 2, recipe_id: 2, name: 'Chicken', amount: '2', unit: 'breasts' },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  // Helper to get dates in the current week for testing
  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  const today = new Date();
  const weekStart = getStartOfWeek(today);
  const mondayDate = new Date(weekStart);
  mondayDate.setDate(mondayDate.getDate() + 1); // Monday
  const tuesdayDate = new Date(weekStart);
  tuesdayDate.setDate(tuesdayDate.getDate() + 2); // Tuesday

  const mockMealPlans = [
    {
      id: 1,
      date: formatDate(mondayDate),
      meal_type: 'breakfast',
      recipe_id: 1,
      notes: 'Morning meal',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      recipe: mockRecipes[0],
    },
    {
      id: 2,
      date: formatDate(tuesdayDate),
      meal_type: 'lunch',
      recipe_id: 2,
      notes: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      recipe: mockRecipes[1],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Loading State Tests
  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      (api.mealPlans.getWeek as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      (api.recipes.getAll as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<MealPlansPage />);

      expect(screen.getByText('Loading meal plans...')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // Calendar Rendering Tests
  describe('Calendar Rendering', () => {
    beforeEach(() => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue(mockMealPlans);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
    });

    it('should display the meal planning title', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Meal Planning')).toBeInTheDocument();
      });
    });

    it('should display all 7 days of the week', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Sunday')).toBeInTheDocument();
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('Tuesday')).toBeInTheDocument();
        expect(screen.getByText('Wednesday')).toBeInTheDocument();
        expect(screen.getByText('Thursday')).toBeInTheDocument();
        expect(screen.getByText('Friday')).toBeInTheDocument();
        expect(screen.getByText('Saturday')).toBeInTheDocument();
      });
    });

    it('should display all 4 meal types', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('breakfast')).toBeInTheDocument();
        expect(screen.getByText('lunch')).toBeInTheDocument();
        expect(screen.getByText('dinner')).toBeInTheDocument();
        expect(screen.getByText('snack')).toBeInTheDocument();
      });
    });

    it('should display existing meal plans in the calendar', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
        expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      });
    });

    it('should display meal notes when present', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Morning meal')).toBeInTheDocument();
      });
    });

    it('should show "Add Meal" buttons for empty slots', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        // Should have many "Add Meal" buttons (7 days * 4 meals - 2 existing = 26)
        const addButtons = screen.getAllByText('+ Add Meal');
        expect(addButtons.length).toBeGreaterThan(20);
      });
    });
  });

  // Week Navigation Tests
  describe('Week Navigation', () => {
    beforeEach(() => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue(mockMealPlans);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
    });

    it('should have Previous Week button', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('← Previous Week')).toBeInTheDocument();
      });
    });

    it('should have Next Week button', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Next Week →')).toBeInTheDocument();
      });
    });

    it('should have Go to Current Week button', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Go to Current Week')).toBeInTheDocument();
      });
    });

    it('should reload data when navigating to next week', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Next Week →')).toBeInTheDocument();
      });

      // Clear previous calls
      (api.mealPlans.getWeek as jest.Mock).mockClear();

      // Click next week
      const nextButton = screen.getByText('Next Week →');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(api.mealPlans.getWeek).toHaveBeenCalled();
      });
    });

    it('should reload data when navigating to previous week', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('← Previous Week')).toBeInTheDocument();
      });

      // Clear previous calls
      (api.mealPlans.getWeek as jest.Mock).mockClear();

      // Click previous week
      const prevButton = screen.getByText('← Previous Week');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(api.mealPlans.getWeek).toHaveBeenCalled();
      });
    });

    it('should reload data when clicking Go to Current Week', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Go to Current Week')).toBeInTheDocument();
      });

      // Clear previous calls
      (api.mealPlans.getWeek as jest.Mock).mockClear();

      // Click current week
      const currentButton = screen.getByText('Go to Current Week');
      fireEvent.click(currentButton);

      await waitFor(() => {
        expect(api.mealPlans.getWeek).toHaveBeenCalled();
      });
    });
  });

  // Add Meal Tests
  describe('Adding Meals', () => {
    beforeEach(() => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue([]);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.mealPlans.create as jest.Mock).mockResolvedValue({
        id: 3,
        date: formatDate(mondayDate),
        meal_type: 'breakfast',
        recipe_id: 1,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        recipe: mockRecipes[0],
      });
    });

    it('should open recipe selection modal when clicking Add Meal', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click first Add Meal button
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Select Recipe for/)).toBeInTheDocument();
      });
    });

    it('should display available recipes in the modal', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal button
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
        expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      });
    });

    it('should show recipe details in the modal', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal button
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Fluffy pancakes')).toBeInTheDocument();
        expect(screen.getByText('Prep: 10m')).toBeInTheDocument();
        expect(screen.getByText('Cook: 15m')).toBeInTheDocument();
      });
    });

    it('should allow adding notes when creating a meal', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal button
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/meal prep/)).toBeInTheDocument();
      });

      // Add notes
      const notesInput = screen.getByPlaceholderText(/meal prep/);
      fireEvent.change(notesInput, { target: { value: 'Double the recipe' } });

      expect(notesInput).toHaveValue('Double the recipe');
    });

    it('should create meal plan when recipe is selected', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal button
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on a recipe
      const recipeButtons = screen.getAllByText('Pancakes');
      const modalRecipeButton = recipeButtons[recipeButtons.length - 1]; // Get the one in modal
      fireEvent.click(modalRecipeButton);

      await waitFor(() => {
        expect(api.mealPlans.create).toHaveBeenCalled();
      });
    });

    it('should close modal after creating meal', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal button
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Select Recipe for/)).toBeInTheDocument();
      });

      // Select recipe
      const recipeButtons = screen.getAllByText('Pancakes');
      fireEvent.click(recipeButtons[recipeButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText(/Select Recipe for/)).not.toBeInTheDocument();
      });
    });

    it('should allow canceling meal creation', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal button
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      // Click Cancel
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText(/Select Recipe for/)).not.toBeInTheDocument();
      });
    });

    it('should show message when no recipes available', async () => {
      (api.recipes.getAll as jest.Mock).mockResolvedValue([]);

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal button
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('No recipes available.')).toBeInTheDocument();
      });
    });
  });

  // Edit Meal Tests
  describe('Editing Meals', () => {
    beforeEach(() => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue(mockMealPlans);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.mealPlans.update as jest.Mock).mockResolvedValue({
        ...mockMealPlans[0],
        notes: 'Updated notes',
      });
    });

    it('should open edit modal when clicking on existing meal', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      const mealButton = screen.getByText('Pancakes');
      fireEvent.click(mealButton);

      await waitFor(() => {
        expect(screen.getByText('Save Notes')).toBeInTheDocument();
      });
    });

    it('should display recipe details in edit modal', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Recipe Details')).toBeInTheDocument();
        expect(screen.getByText('Fluffy pancakes')).toBeInTheDocument();
      });
    });

    it('should allow editing notes', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        const notesInput = screen.getByPlaceholderText(/Add notes for this meal/);
        expect(notesInput).toBeInTheDocument();
      });

      // Edit notes
      const notesInput = screen.getByPlaceholderText(/Add notes for this meal/);
      fireEvent.change(notesInput, { target: { value: 'New notes' } });

      expect(notesInput).toHaveValue('New notes');
    });

    it('should save notes when clicking Save Notes', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Save Notes')).toBeInTheDocument();
      });

      // Edit notes
      const notesInput = screen.getByPlaceholderText(/Add notes for this meal/);
      fireEvent.change(notesInput, { target: { value: 'Updated notes' } });

      // Save
      fireEvent.click(screen.getByText('Save Notes'));

      await waitFor(() => {
        expect(api.mealPlans.update).toHaveBeenCalled();
      });
    });

    it('should allow changing recipe', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Change Recipe')).toBeInTheDocument();
      });

      // Click Change Recipe
      fireEvent.click(screen.getByText('Change Recipe'));

      await waitFor(() => {
        expect(screen.getByText(/Select Recipe for/)).toBeInTheDocument();
      });
    });

    it('should have delete button in edit modal', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('should allow canceling edit', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Save Notes')).toBeInTheDocument();
      });

      // Click Cancel
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Save Notes')).not.toBeInTheDocument();
      });
    });
  });

  // Delete Meal Tests
  describe('Deleting Meals', () => {
    beforeEach(() => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue(mockMealPlans);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.mealPlans.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('should show confirmation dialog when deleting meal', async () => {
      // Mock window.confirm
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      // Click Delete
      fireEvent.click(screen.getByText('Delete'));

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this meal plan?'
      );

      mockConfirm.mockRestore();
    });

    it('should delete meal when confirmed', async () => {
      // Mock window.confirm to return true
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      // Click Delete
      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(api.mealPlans.delete).toHaveBeenCalledWith(1);
      });

      mockConfirm.mockRestore();
    });

    it('should not delete meal when cancelled', async () => {
      // Mock window.confirm to return false
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      // Click Delete
      fireEvent.click(screen.getByText('Delete'));

      expect(api.mealPlans.delete).not.toHaveBeenCalled();

      mockConfirm.mockRestore();
    });

    it('should close modal after deleting', async () => {
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on the meal
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      // Click Delete
      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.queryByText('Save Notes')).not.toBeInTheDocument();
      });

      mockConfirm.mockRestore();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should display error when API fails', async () => {
      (api.mealPlans.getWeek as jest.Mock).mockRejectedValue(new Error('API Error'));
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('should handle create meal error with alert', async () => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue([]);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.mealPlans.create as jest.Mock).mockRejectedValue(new Error('Failed to create'));

      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal and select recipe
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const recipeButtons = screen.getAllByText('Pancakes');
      fireEvent.click(recipeButtons[recipeButtons.length - 1]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to create');
      });

      mockAlert.mockRestore();
    });

    it('should handle update meal error with alert', async () => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue(mockMealPlans);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.mealPlans.update as jest.Mock).mockRejectedValue(new Error('Failed to update'));

      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on meal and save
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Save Notes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Notes'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to update');
      });

      mockAlert.mockRestore();
    });

    it('should handle delete meal error with alert', async () => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue(mockMealPlans);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
      (api.mealPlans.delete as jest.Mock).mockRejectedValue(new Error('Failed to delete'));

      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Click on meal and delete
      fireEvent.click(screen.getByText('Pancakes'));

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to delete');
      });

      mockAlert.mockRestore();
      mockConfirm.mockRestore();
    });
  });

  // Navigation Links Tests
  describe('Navigation Links', () => {
    beforeEach(() => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue(mockMealPlans);
      (api.recipes.getAll as jest.Mock).mockResolvedValue(mockRecipes);
    });

    it('should have Back to Home link', async () => {
      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Home')).toBeInTheDocument();
      });

      const link = screen.getByText('Back to Home');
      expect(link.closest('a')).toHaveAttribute('href', '/');
    });

    it('should have link to create recipe when no recipes available', async () => {
      (api.mealPlans.getWeek as jest.Mock).mockResolvedValue([]);
      (api.recipes.getAll as jest.Mock).mockResolvedValue([]);

      render(<MealPlansPage />);

      await waitFor(() => {
        expect(screen.getAllByText('+ Add Meal').length).toBeGreaterThan(0);
      });

      // Click Add Meal to open modal
      const addButtons = screen.getAllByText('+ Add Meal');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Create your first recipe →')).toBeInTheDocument();
      });

      const link = screen.getByText('Create your first recipe →');
      expect(link.closest('a')).toHaveAttribute('href', '/recipes');
    });
  });
});
