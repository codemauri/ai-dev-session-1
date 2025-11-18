import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditRecipe from '../page';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    recipes: {
      getById: jest.fn(),
      update: jest.fn(),
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
        <button onClick={() => onChange(4)}>Set Rating</button>
        <span>Rating: {rating || 0}</span>
      </div>
    );
  };
});

describe('EditRecipe - Image Upload', () => {
  const mockCategories = [
    { id: 1, name: 'Breakfast', description: 'Morning meals' },
    { id: 2, name: 'Lunch', description: 'Midday meals' },
  ];

  const mockExistingRecipe = {
    id: 456,
    title: 'Existing Recipe',
    description: 'An existing recipe',
    instructions: 'Original instructions',
    prep_time: 15,
    cook_time: 25,
    servings: 2,
    calories: 350,
    protein: 20.0,
    carbohydrates: 35.0,
    fat: 12.0,
    rating: 4.5,
    image_url: 'https://example.com/old-image.jpg',
    is_public: false,
    share_token: null,
    category_id: 1,
    category: mockCategories[0],
    ingredients: [
      { id: 1, recipe_id: 456, name: 'Ingredient 1', amount: '2', unit: 'cups' },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockUpdatedRecipe = {
    ...mockExistingRecipe,
    title: 'Updated Recipe',
  };

  // Mock params
  const mockParams = Promise.resolve({ id: '456' });

  beforeEach(() => {
    jest.clearAllMocks();
    (api.categories.getAll as jest.Mock).mockResolvedValue(mockCategories);
    (api.recipes.getById as jest.Mock).mockResolvedValue(mockExistingRecipe);
    (api.recipes.update as jest.Mock).mockResolvedValue(mockUpdatedRecipe);
    (api.recipes.uploadImage as jest.Mock).mockResolvedValue({
      ...mockUpdatedRecipe,
      image_url: '/uploads/recipes/new-image.jpg',
    });
  });

  describe('Image Upload UI on Edit Page', () => {
    it('should render image URL input with existing value', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Image URL/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByLabelText(/Image URL/i) as HTMLInputElement;
      expect(urlInput.value).toBe('https://example.com/old-image.jpg');
    });

    it('should render file upload input field', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i);
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png,image/gif,image/webp');
    });

    it('should display "OR" separator between URL and file upload', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText(/— OR —/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Selection on Edit', () => {
    it('should show selected file name and size when file is selected', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;

      // Create a mock file (250 KB)
      const file = new File(['x'.repeat(250 * 1024)], 'new-photo.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Selected: new-photo.png/i)).toBeInTheDocument();
        expect(screen.getByText(/250.0 KB/i)).toBeInTheDocument();
      });
    });

    it('should show error when file is too large (> 5MB)', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;

      // Create a mock file > 5MB
      const largeFile = new File(
        ['x'.repeat(7 * 1024 * 1024)],
        'huge-image.jpg',
        { type: 'image/jpeg' }
      );

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Image file too large. Maximum size is 5MB/i)).toBeInTheDocument();
      });
    });
  });

  describe('Update Recipe with New Image URL', () => {
    it('should update recipe with new image URL only (no file)', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Change the image URL
      const urlInput = screen.getByLabelText(/Image URL/i);
      fireEvent.change(urlInput, {
        target: { value: 'https://example.com/new-url-image.jpg' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.recipes.update).toHaveBeenCalledWith(
          456,
          expect.objectContaining({
            image_url: 'https://example.com/new-url-image.jpg',
          })
        );
      });

      // Should NOT call uploadImage when only URL is changed
      expect(api.recipes.uploadImage).not.toHaveBeenCalled();

      // Should redirect to recipe detail page
      expect(mockPush).toHaveBeenCalledWith('/recipes/456');
    });
  });

  describe('Update Recipe with File Upload', () => {
    it('should update recipe and then upload new image file', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Change title
      fireEvent.change(screen.getByLabelText(/Recipe Title/i), {
        target: { value: 'Updated Recipe Title' },
      });

      // Select a new file
      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const file = new File(['updated image'], 'updated-photo.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should update recipe first
        expect(api.recipes.update).toHaveBeenCalledWith(
          456,
          expect.objectContaining({
            title: 'Updated Recipe Title',
          })
        );
      });

      await waitFor(() => {
        // Should then upload the new image
        expect(api.recipes.uploadImage).toHaveBeenCalledWith(456, file);
      });

      // Should redirect to recipe detail page
      expect(mockPush).toHaveBeenCalledWith('/recipes/456');
    });

    it('should handle upload failure gracefully (recipe still updated)', async () => {
      (api.recipes.uploadImage as jest.Mock).mockRejectedValue(
        new Error('Upload failed')
      );

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Select a file
      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const file = new File(['test'], 'image.gif', { type: 'image/gif' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(api.recipes.update).toHaveBeenCalled();
        expect(api.recipes.uploadImage).toHaveBeenCalled();
      });

      await waitFor(() => {
        // Should NOT redirect when upload fails
        expect(mockPush).not.toHaveBeenCalled();
        // Should show error message
        expect(screen.getByText(/Recipe updated, but image upload failed/i)).toBeInTheDocument();
      });

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Image upload failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Clear Image URL and Upload File', () => {
    it('should replace URL with uploaded file', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Recipe Title/i)).toBeInTheDocument();
      });

      // Clear the existing URL
      const urlInput = screen.getByLabelText(/Image URL/i);
      fireEvent.change(urlInput, { target: { value: '' } });

      // Upload a new file instead
      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const file = new File(['new'], 'replacement.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(api.recipes.update).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(api.recipes.uploadImage).toHaveBeenCalledWith(456, file);
      });
    });
  });

  describe('Multiple File Types', () => {
    it('should accept JPEG files', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const jpegFile = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [jpegFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Selected: photo.jpg/i)).toBeInTheDocument();
      });
    });

    it('should accept PNG files', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const pngFile = new File(['png'], 'graphic.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [pngFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Selected: graphic.png/i)).toBeInTheDocument();
      });
    });

    it('should accept WebP files', async () => {
      render(<EditRecipe params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/Upload Image/i) as HTMLInputElement;
      const webpFile = new File(['webp'], 'modern.webp', { type: 'image/webp' });

      fireEvent.change(fileInput, { target: { files: [webpFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Selected: modern.webp/i)).toBeInTheDocument();
      });
    });
  });
});
