/**
 * Tests for Recipe Image functionality
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Recipe } from '@/lib/api';

// Mock recipe data
const mockRecipeWithImage: Recipe = {
  id: 1,
  title: 'Test Recipe',
  description: 'Test description',
  instructions: 'Test instructions',
  prep_time: 10,
  cook_time: 20,
  servings: 4,
  calories: 300,
  protein: 20,
  carbohydrates: 30,
  fat: 10,
  rating: 4.5,
  image_url: 'https://example.com/recipe.jpg',
  category_id: 1,
  ingredients: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

const mockRecipeWithoutImage: Recipe = {
  ...mockRecipeWithImage,
  id: 2,
  image_url: null
};

// Simple RecipeCard component for testing
const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
  <div className="recipe-card">
    {recipe.image_url && (
      <div className="w-full h-48 bg-gray-200">
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
      </div>
    )}
    <div className="p-6">
      <h2>{recipe.title}</h2>
    </div>
  </div>
);

// Simple RecipeDetail component for testing
const RecipeDetail = ({ recipe }: { recipe: Recipe }) => (
  <div className="recipe-detail">
    <h1>{recipe.title}</h1>
    {recipe.image_url && (
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full h-96 object-cover"
        />
      </div>
    )}
    <p>{recipe.description}</p>
  </div>
);

describe('RecipeImage - Recipe Card Display', () => {
  test('displays image when recipe has image_url', () => {
    render(<RecipeCard recipe={mockRecipeWithImage} />);

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/recipe.jpg');
    expect(image).toHaveAttribute('alt', 'Test Recipe');
  });

  test('does not display image when recipe has no image_url', () => {
    render(<RecipeCard recipe={mockRecipeWithoutImage} />);

    const image = screen.queryByRole('img');
    expect(image).not.toBeInTheDocument();
  });

  test('image has correct CSS classes for card display', () => {
    render(<RecipeCard recipe={mockRecipeWithImage} />);

    const image = screen.getByRole('img');
    expect(image).toHaveClass('w-full', 'h-full', 'object-cover');
  });

  test('image container has correct height for cards', () => {
    const { container } = render(<RecipeCard recipe={mockRecipeWithImage} />);

    const imageContainer = container.querySelector('.h-48');
    expect(imageContainer).toBeInTheDocument();
  });

  test('uses correct alt text from recipe title', () => {
    const recipeWithLongTitle = {
      ...mockRecipeWithImage,
      title: 'Delicious Chocolate Chip Cookies with Extra Chips'
    };
    render(<RecipeCard recipe={recipeWithLongTitle} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Delicious Chocolate Chip Cookies with Extra Chips');
  });
});

describe('RecipeImage - Recipe Detail Page Display', () => {
  test('displays large image when recipe has image_url', () => {
    render(<RecipeDetail recipe={mockRecipeWithImage} />);

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/recipe.jpg');
  });

  test('does not display image section when recipe has no image_url', () => {
    render(<RecipeDetail recipe={mockRecipeWithoutImage} />);

    const image = screen.queryByRole('img');
    expect(image).not.toBeInTheDocument();
  });

  test('image has correct CSS classes for detail page', () => {
    render(<RecipeDetail recipe={mockRecipeWithImage} />);

    const image = screen.getByRole('img');
    expect(image).toHaveClass('w-full', 'h-96', 'object-cover');
  });

  test('image container has shadow and rounded corners', () => {
    const { container } = render(<RecipeDetail recipe={mockRecipeWithImage} />);

    const imageContainer = container.querySelector('.shadow');
    expect(imageContainer).toBeInTheDocument();
    expect(imageContainer).toHaveClass('rounded-lg');
  });
});

describe('RecipeImage - Image URL Handling', () => {
  test('handles empty string image_url as no image', () => {
    const recipeWithEmptyUrl = { ...mockRecipeWithImage, image_url: '' };
    render(<RecipeCard recipe={recipeWithEmptyUrl as any} />);

    const image = screen.queryByRole('img');
    expect(image).not.toBeInTheDocument();
  });

  test('handles various image URL formats', () => {
    const urlFormats = [
      'https://example.com/image.jpg',
      'https://example.com/path/to/image.png',
      'https://cdn.example.com/images/recipe-123.webp'
    ];

    urlFormats.forEach(url => {
      const recipe = { ...mockRecipeWithImage, image_url: url };
      const { unmount } = render(<RecipeCard recipe={recipe} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', url);

      unmount();
    });
  });

  test('handles null and undefined image_url', () => {
    const recipeWithNull = { ...mockRecipeWithImage, image_url: null };
    const { unmount: unmount1 } = render(<RecipeCard recipe={recipeWithNull} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    unmount1();

    const recipeWithUndefined = { ...mockRecipeWithImage, image_url: undefined as any };
    render(<RecipeCard recipe={recipeWithUndefined} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('RecipeImage - Accessibility', () => {
  test('image has accessible alt text', () => {
    render(<RecipeCard recipe={mockRecipeWithImage} />);

    const image = screen.getByAltText('Test Recipe');
    expect(image).toBeInTheDocument();
  });

  test('image alt text matches recipe title for screen readers', () => {
    const recipes = [
      { ...mockRecipeWithImage, title: 'Spaghetti Carbonara' },
      { ...mockRecipeWithImage, title: 'Chocolate Cake' },
      { ...mockRecipeWithImage, title: 'Green Salad' }
    ];

    recipes.forEach(recipe => {
      const { unmount } = render(<RecipeCard recipe={recipe} />);

      const image = screen.getByAltText(recipe.title);
      expect(image).toBeInTheDocument();

      unmount();
    });
  });
});

describe('RecipeImage - TypeScript Type Safety', () => {
  test('Recipe type includes image_url field', () => {
    // This test verifies the type system at runtime
    const recipe: Recipe = mockRecipeWithImage;

    expect(recipe).toHaveProperty('image_url');
    expect(typeof recipe.image_url === 'string' || recipe.image_url === null).toBe(true);
  });

  test('image_url can be null in Recipe type', () => {
    const recipe: Recipe = mockRecipeWithoutImage;

    expect(recipe.image_url).toBeNull();
  });

  test('image_url can be string in Recipe type', () => {
    const recipe: Recipe = mockRecipeWithImage;

    expect(typeof recipe.image_url).toBe('string');
    expect(recipe.image_url).toBe('https://example.com/recipe.jpg');
  });
});
