import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShareModal from '../ShareModal';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    recipes: {
      getById: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('ShareModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnShare = jest.fn();
  const mockOnUnshare = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    recipeId: 1,
    recipeTitle: 'Test Recipe',
    shareToken: null,
    isPublic: false,
    onShare: mockOnShare,
    onUnshare: mockOnUnshare,
  };

  const mockRecipe = {
    id: 1,
    title: 'Test Recipe',
    instructions: 'Test instructions',
    description: 'Test description',
    prep_time: 10,
    cook_time: 20,
    servings: 4,
    category_id: 1,
    is_public: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location for share URL generation
    delete (window as any).location;
    window.location = { origin: 'http://localhost:3000' } as any;
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    // Mock alert
    global.alert = jest.fn();
    // Setup default API mocks
    (api.recipes.getById as jest.Mock).mockResolvedValue(mockRecipe);
    (api.recipes.update as jest.Mock).mockResolvedValue({});
  });

  // Modal Visibility Tests
  describe('Modal Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<ShareModal {...defaultProps} />);
      expect(screen.getByText('Recipe Visibility')).toBeInTheDocument();
      expect(screen.getByText('Control who can see "Test Recipe"')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ShareModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Recipe Visibility')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(<ShareModal {...defaultProps} />);
      const closeButtons = screen.getAllByRole('button');
      const topCloseButton = closeButtons.find(btn => btn.querySelector('svg'));
      fireEvent.click(topCloseButton!);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Close button is clicked', () => {
      render(<ShareModal {...defaultProps} />);
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Share Link Toggle Tests
  describe('Share Link Toggle', () => {
    it('should show correct text when share link is off', () => {
      render(<ShareModal {...defaultProps} shareToken={null} />);
      expect(screen.getByText('Share Link')).toBeInTheDocument();
      expect(screen.getByText('Generate a link to share this recipe')).toBeInTheDocument();
    });

    it('should show correct text when share link is on', () => {
      render(<ShareModal {...defaultProps} shareToken="test-token-123" />);
      expect(screen.getByText('Share Link')).toBeInTheDocument();
      expect(screen.getByText('Anyone with the link can view (even if private)')).toBeInTheDocument();
    });

    it('should call onShare when toggling share link on', async () => {
      mockOnShare.mockResolvedValue(undefined);
      render(<ShareModal {...defaultProps} shareToken={null} />);

      // Find the first toggle button (Share Link toggle)
      const toggleButtons = screen.getAllByRole('button');
      const shareLinkToggle = toggleButtons.find(btn =>
        btn.className.includes('inline-flex h-6 w-11') && btn.className.includes('bg-gray-200')
      );

      fireEvent.click(shareLinkToggle!);

      await waitFor(() => {
        expect(mockOnShare).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onUnshare when toggling share link off', async () => {
      mockOnUnshare.mockResolvedValue(undefined);
      render(<ShareModal {...defaultProps} shareToken="test-token-123" />);

      // Find the first toggle button (Share Link toggle) - should be blue when on
      const toggleButtons = screen.getAllByRole('button');
      const shareLinkToggle = toggleButtons.find(btn =>
        btn.className.includes('inline-flex h-6 w-11') && btn.className.includes('bg-blue-600')
      );

      fireEvent.click(shareLinkToggle!);

      await waitFor(() => {
        expect(mockOnUnshare).toHaveBeenCalledTimes(1);
      });
    });

    it('should show share URL when token exists', () => {
      render(<ShareModal {...defaultProps} shareToken="test-token-123" />);
      expect(screen.getByDisplayValue('http://localhost:3000/share/test-token-123')).toBeInTheDocument();
    });

    it('should not show share URL when token is null', () => {
      render(<ShareModal {...defaultProps} shareToken={null} />);
      expect(screen.queryByDisplayValue(/http/)).not.toBeInTheDocument();
    });
  });

  // Public/Private Toggle Tests
  describe('Public/Private Toggle', () => {
    it('should display "Private" status when recipe is not public', () => {
      render(<ShareModal {...defaultProps} isPublic={false} />);
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.getByText('Only visible to you (and via share link)')).toBeInTheDocument();
    });

    it('should display "Public" status when recipe is public', () => {
      render(<ShareModal {...defaultProps} isPublic={true} />);
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('Visible in search results and recipe lists')).toBeInTheDocument();
    });

    it('should fetch recipe and update is_public when toggling to public', async () => {
      render(<ShareModal {...defaultProps} isPublic={false} />);

      // Find the second toggle button (Public/Private toggle) - should be gray when private
      const toggleButtons = screen.getAllByRole('button');
      const publicPrivateToggle = toggleButtons.filter(btn =>
        btn.className.includes('inline-flex h-6 w-11')
      )[1]; // Second toggle

      fireEvent.click(publicPrivateToggle!);

      await waitFor(() => {
        expect(api.recipes.getById).toHaveBeenCalledWith(1);
        expect(api.recipes.update).toHaveBeenCalledWith(1, {
          title: 'Test Recipe',
          instructions: 'Test instructions',
          description: 'Test description',
          prep_time: 10,
          cook_time: 20,
          servings: 4,
          category_id: 1,
          is_public: true, // Toggled from false to true
        });
      });
    });

    it('should fetch recipe and update is_public when toggling to private', async () => {
      render(<ShareModal {...defaultProps} isPublic={true} />);

      // Find the second toggle button (Public/Private toggle) - should be green when public
      const toggleButtons = screen.getAllByRole('button');
      const publicPrivateToggle = toggleButtons.filter(btn =>
        btn.className.includes('inline-flex h-6 w-11')
      )[1]; // Second toggle

      fireEvent.click(publicPrivateToggle!);

      await waitFor(() => {
        expect(api.recipes.getById).toHaveBeenCalledWith(1);
        expect(api.recipes.update).toHaveBeenCalledWith(1, {
          title: 'Test Recipe',
          instructions: 'Test instructions',
          description: 'Test description',
          prep_time: 10,
          cook_time: 20,
          servings: 4,
          category_id: 1,
          is_public: false, // Toggled from true to false
        });
      });
    });

    it('should show alert on error when toggling public/private fails', async () => {
      (api.recipes.update as jest.Mock).mockRejectedValue(new Error('Update failed'));
      render(<ShareModal {...defaultProps} isPublic={false} />);

      const toggleButtons = screen.getAllByRole('button');
      const publicPrivateToggle = toggleButtons.filter(btn =>
        btn.className.includes('inline-flex h-6 w-11')
      )[1];

      fireEvent.click(publicPrivateToggle!);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to update recipe visibility: Update failed');
      });
    });
  });

  // Copy to Clipboard Tests
  describe('Copy to Clipboard', () => {
    it('should copy share URL to clipboard when Copy button is clicked', async () => {
      render(<ShareModal {...defaultProps} shareToken="test-token-123" />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/share/test-token-123');
      });
    });

    it('should show "Copied!" feedback after copying', async () => {
      render(<ShareModal {...defaultProps} shareToken="test-token-123" />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should reset "Copied!" feedback after 2 seconds', async () => {
      jest.useFakeTimers();
      render(<ShareModal {...defaultProps} shareToken="test-token-123" />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
      }, { timeout: 100 });

      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should handle clipboard copy failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));

      render(<ShareModal {...defaultProps} shareToken="test-token-123" />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // Recipe Title Display Tests
  describe('Recipe Title Display', () => {
    it('should display the correct recipe title', () => {
      render(<ShareModal {...defaultProps} recipeTitle="Delicious Pasta" />);
      expect(screen.getByText('Control who can see "Delicious Pasta"')).toBeInTheDocument();
    });

    it('should handle special characters in recipe title', () => {
      render(<ShareModal {...defaultProps} recipeTitle={`Mom's "Secret" Recipe`} />);
      expect(screen.getByText(/Secret/)).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Independent Controls', () => {
    it('should allow share link to be enabled while recipe is private', async () => {
      mockOnShare.mockResolvedValue(undefined);
      const { rerender } = render(<ShareModal {...defaultProps} isPublic={false} shareToken={null} />);

      // Verify starts as private with no share link
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.queryByDisplayValue(/http/)).not.toBeInTheDocument();

      // Enable share link
      const toggleButtons = screen.getAllByRole('button');
      const shareLinkToggle = toggleButtons.filter(btn =>
        btn.className.includes('inline-flex h-6 w-11')
      )[0];
      fireEvent.click(shareLinkToggle!);

      await waitFor(() => {
        expect(mockOnShare).toHaveBeenCalled();
      });

      // Re-render with share token (simulating parent update)
      rerender(<ShareModal {...defaultProps} isPublic={false} shareToken="new-token" />);

      // Verify recipe is still private but has share link
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://localhost:3000/share/new-token')).toBeInTheDocument();
    });

    it('should allow making recipe public without generating share link', async () => {
      render(<ShareModal {...defaultProps} isPublic={false} shareToken={null} />);

      // Verify starts as private with no share link
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.queryByDisplayValue(/http/)).not.toBeInTheDocument();

      // Toggle to public
      const toggleButtons = screen.getAllByRole('button');
      const publicPrivateToggle = toggleButtons.filter(btn =>
        btn.className.includes('inline-flex h-6 w-11')
      )[1];
      fireEvent.click(publicPrivateToggle!);

      await waitFor(() => {
        expect(api.recipes.update).toHaveBeenCalledWith(1, expect.objectContaining({
          is_public: true,
        }));
      });

      // Share link should still not exist
      expect(screen.queryByDisplayValue(/http/)).not.toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper modal structure with backdrop', () => {
      const { container } = render(<ShareModal {...defaultProps} />);
      const backdrop = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have focusable buttons', () => {
      render(<ShareModal {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have readonly share URL input when share link exists', () => {
      render(<ShareModal {...defaultProps} shareToken="test-token" />);
      const input = screen.getByDisplayValue(/http/);
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveAttribute('type', 'text');
    });
  });
});
