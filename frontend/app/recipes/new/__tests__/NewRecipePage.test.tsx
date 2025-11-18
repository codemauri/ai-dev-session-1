import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewRecipe from '../page';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    recipes: {
      create: jest.fn(),
      uploadImage: jest.fn(),
    },
    categories: {
      getAll: jest.fn(),
    },
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock StarRating component
jest.mock('@/components/StarRating', () => {
  return function MockStarRating({ onChange, rating }: any) {
    return (
      <div data-testid="star-rating">
        <button onClick={() => onChange(3)}>Set Rating</button>
        <span>Rating: {rating || 0}</span>
      </div>
    );
  };
});

describe('NewRecipe - Image Upload', () => {
  const mockCategories = [
    { id: 1, name: 'Breakfast', description: 'Morning meals' },
    { id: 2, name: 'Lunch', description: 'Midday meals' },
  ];

  const mockCreatedRecipe = {
    id: 123,
    title: 'Test Recipe',
    description: 'A test recipe',
    instructions: 'Test instructions',
    prep_time: 10,
    cook_time: 20,
    servings: 4,
    calories: 300,
    protein: 15.0,
    carbohydrates: 30.0,
    fat: 10.0,
    rating: 4.0,
    image_url: null,
    is_public: false,
    share_token: null,
    category_id: 1,
    category: mockCategories[0],
    ingredients: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (api.categories.getAll as jest.Mock).mockResolvedValue(mockCategories);
    (api.recipes.create as jest.Mock).mockResolvedValue(mockCreatedRecipe);
    (api.recipes.uploadImage as jest.Mock).mockResolvedValue({
      ...mockCreatedRecipe,
      image_url: '/uploads/recipes/test-image.jpg',
    });
  });

  describe('Image Upload UI', () => {
    it('should render image URL input field', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Image URL/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByLabelText(/Image URL/i);
      expect(urlInput).toHaveAttribute('type', 'text');
      expect(urlInput).toHaveAttribute('placeholder', 'https://example.com/recipe-image.jpg');
    });

    it('should render file upload input field', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i);
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png,image/gif,image/webp');
    });

    it('should display "OR" separator between URL and file upload', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByText(/— OR —/i)).toBeInTheDocument();
      });
    });

    it('should show helper text for both input methods', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByText(/Enter a URL to an image for this recipe/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload an image from your computer/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Selection', () => {
    it('should show selected file name and size when file is selected', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;

      // Create a mock file (100 KB)
      const file = new File(['x'.repeat(100 * 1024)], 'test-image.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Selected: test-image.jpg/i)).toBeInTheDocument();
        expect(screen.getByText(/100.0 KB/i)).toBeInTheDocument();
      });
    });

    it('should show error when file is too large (> 5MB)', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;

      // Create a mock file > 5MB
      const largeFile = new File(
        ['x'.repeat(6 * 1024 * 1024)],
        'large-image.jpg',
        { type: 'image/jpeg' }
      );

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Image file too large. Maximum size is 5MB/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission with Image URL', () => {
    it('should submit recipe with image URL only (no file upload)', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Recipe Title/i), {
        target: { value: 'Test Recipe' },
      });

      fireEvent.change(screen.getByLabelText(/Image URL/i), {
        target: { value: 'https://example.com/image.jpg' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Recipe/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.recipes.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Recipe',
            image_url: 'https://example.com/image.jpg',
          })
        );
      });

      // Should NOT call uploadImage when only URL is provided
      expect(api.recipes.uploadImage).not.toHaveBeenCalled();

      // Should redirect to recipe detail page
      expect(mockPush).toHaveBeenCalledWith('/recipes/123');
    });
  });

  describe('Form Submission with File Upload', () => {
    it('should submit recipe and then upload image file', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Recipe Title/i), {
        target: { value: 'Test Recipe with Image' },
      });

      // Select a file
      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const file = new File(['test'], 'recipe-photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Recipe/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should create recipe first
        expect(api.recipes.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Recipe with Image',
          })
        );
      });

      await waitFor(() => {
        // Should then upload the image
        expect(api.recipes.uploadImage).toHaveBeenCalledWith(123, file);
      });

      // Should redirect to recipe detail page
      expect(mockPush).toHaveBeenCalledWith('/recipes/123');
    });

    it('should handle upload failure gracefully (recipe still created)', async () => {
      (api.recipes.uploadImage as jest.Mock).mockRejectedValue(
        new Error('Upload failed')
      );

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Recipe Title/i), {
        target: { value: 'Test Recipe' },
      });

      // Select a file
      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Create Recipe/i }));

      await waitFor(() => {
        expect(api.recipes.create).toHaveBeenCalled();
        expect(api.recipes.uploadImage).toHaveBeenCalled();
      });

      await waitFor(() => {
        // Should still redirect even if upload fails
        expect(mockPush).toHaveBeenCalledWith('/recipes/123');
      });

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Image upload failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Both URL and File Provided', () => {
    it('should prioritize file upload over URL when both are provided', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Recipe Title/i), {
        target: { value: 'Test Recipe' },
      });

      // Set both URL and file
      fireEvent.change(screen.getByLabelText(/Image URL/i), {
        target: { value: 'https://example.com/image.jpg' },
      });

      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const file = new File(['test'], 'uploaded.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Create Recipe/i }));

      await waitFor(() => {
        expect(api.recipes.create).toHaveBeenCalled();
      });

      await waitFor(() => {
        // Should upload the file (file takes precedence)
        expect(api.recipes.uploadImage).toHaveBeenCalledWith(123, file);
      });
    });
  });

  describe('Complete Form with All Fields', () => {
    it('should submit complete recipe with image file', async () => {
      render(<NewRecipe />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/Recipe Title/i), {
        target: { value: 'Complete Recipe' },
      });
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { value: 'A complete test recipe' },
      });
      // Instructions textarea doesn't have proper label, use placeholder
      const instructionsTextarea = screen.getByPlaceholderText(/Step-by-step instructions/i);
      fireEvent.change(instructionsTextarea, {
        target: { value: 'Step 1, Step 2, Step 3' },
      });

      // Upload image
      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const file = new File(['image data'], 'complete-recipe.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /Create Recipe/i }));

      await waitFor(() => {
        expect(api.recipes.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Complete Recipe',
            description: 'A complete test recipe',
            instructions: 'Step 1, Step 2, Step 3',
          })
        );
      });

      await waitFor(() => {
        expect(api.recipes.uploadImage).toHaveBeenCalledWith(123, file);
      });

      expect(mockPush).toHaveBeenCalledWith('/recipes/123');
    });
  });
});
