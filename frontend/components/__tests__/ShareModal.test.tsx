import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShareModal from '../ShareModal';

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
  });

  // Modal Visibility Tests
  describe('Modal Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<ShareModal {...defaultProps} />);
      expect(screen.getByText('Share Recipe')).toBeInTheDocument();
      expect(screen.getByText('Share "Test Recipe" with others')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ShareModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Share Recipe')).not.toBeInTheDocument();
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

  // Public/Private Toggle Tests
  describe('Public/Private Toggle', () => {
    it('should display "Private" status when recipe is not public', () => {
      render(<ShareModal {...defaultProps} isPublic={false} />);
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.getByText('Only you can view this recipe')).toBeInTheDocument();
    });

    it('should display "Public" status when recipe is public', () => {
      render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token-123" />);
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('Anyone with the link can view this recipe')).toBeInTheDocument();
    });

    it('should call onShare when toggling from private to public', async () => {
      mockOnShare.mockResolvedValue(undefined);
      render(<ShareModal {...defaultProps} isPublic={false} />);

      // Find toggle button by its unique className pattern
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.className.includes('inline-flex h-6 w-11'));

      fireEvent.click(toggleButton!);

      await waitFor(() => {
        expect(mockOnShare).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onUnshare when toggling from public to private', async () => {
      mockOnUnshare.mockResolvedValue(undefined);
      render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token-123" />);

      // Find toggle button by its unique className pattern
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.className.includes('inline-flex h-6 w-11'));

      fireEvent.click(toggleButton!);

      await waitFor(() => {
        expect(mockOnUnshare).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable toggle button while loading', async () => {
      mockOnShare.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ShareModal {...defaultProps} isPublic={false} />);

      // Find toggle button by its unique className pattern
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.className.includes('inline-flex h-6 w-11'));

      fireEvent.click(toggleButton!);

      expect(toggleButton).toBeDisabled();
    });
  });

  // Share Link Tests
  describe('Share Link Display', () => {
    it('should not show share link when recipe is private', () => {
      render(<ShareModal {...defaultProps} isPublic={false} shareToken={null} />);
      expect(screen.queryByText('Share Link')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue(/http/)).not.toBeInTheDocument();
    });

    it('should show share link when recipe is public', () => {
      render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token-123" />);
      expect(screen.getByText('Share Link')).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://localhost:3000/share/test-token-123')).toBeInTheDocument();
    });

    it('should generate correct share URL format', () => {
      const shareToken = 'abc-def-ghi-123';
      render(<ShareModal {...defaultProps} isPublic={true} shareToken={shareToken} />);

      const input = screen.getByDisplayValue(`http://localhost:3000/share/${shareToken}`);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('readonly');
    });
  });

  // Copy to Clipboard Tests
  describe('Copy to Clipboard', () => {
    it('should copy share URL to clipboard when Copy button is clicked', async () => {
      render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token-123" />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/share/test-token-123');
      });
    });

    it('should show "Copied!" feedback after copying', async () => {
      render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token-123" />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should reset "Copied!" feedback after 2 seconds', async () => {
      jest.useFakeTimers();
      render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token-123" />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Advance timers and run pending timers
      jest.advanceTimersByTime(2000);

      // Wait for state update
      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
      }, { timeout: 100 });

      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should handle clipboard copy failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));

      render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token-123" />);

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
      expect(screen.getByText('Share "Delicious Pasta" with others')).toBeInTheDocument();
    });

    it('should handle special characters in recipe title', () => {
      render(<ShareModal {...defaultProps} recipeTitle={`Mom's "Secret" Recipe`} />);
      expect(screen.getByText(/Secret/)).toBeInTheDocument();
    });

    it('should handle long recipe titles', () => {
      const longTitle = 'A Very Long Recipe Title That Contains Many Words And Should Still Be Displayed Properly';
      render(<ShareModal {...defaultProps} recipeTitle={longTitle} />);
      expect(screen.getByText(`Share "${longTitle}" with others`)).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Full Workflow Integration', () => {
    it('should complete full share workflow: toggle public, show link, copy', async () => {
      mockOnShare.mockResolvedValue(undefined);
      const { rerender } = render(<ShareModal {...defaultProps} isPublic={false} shareToken={null} />);

      // Step 1: Verify starts as private
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.queryByText('Share Link')).not.toBeInTheDocument();

      // Step 2: Toggle to public
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.className.includes('inline-flex h-6 w-11'));
      fireEvent.click(toggleButton!);

      await waitFor(() => {
        expect(mockOnShare).toHaveBeenCalled();
      });

      // Step 3: Re-render with updated props (simulating parent state update)
      rerender(<ShareModal {...defaultProps} isPublic={true} shareToken="new-token-456" />);

      // Step 4: Verify now shows as public with share link
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('Share Link')).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://localhost:3000/share/new-token-456')).toBeInTheDocument();

      // Step 5: Copy the link
      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/share/new-token-456');
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should complete unshare workflow: toggle private, hide link', async () => {
      mockOnUnshare.mockResolvedValue(undefined);
      const { rerender } = render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token" />);

      // Step 1: Verify starts as public with link
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('Share Link')).toBeInTheDocument();

      // Step 2: Toggle to private
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.className.includes('inline-flex h-6 w-11'));
      fireEvent.click(toggleButton!);

      await waitFor(() => {
        expect(mockOnUnshare).toHaveBeenCalled();
      });

      // Step 3: Re-render with updated props
      rerender(<ShareModal {...defaultProps} isPublic={false} shareToken="test-token" />);

      // Step 4: Verify now shows as private without share link display
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.queryByText('Share Link')).not.toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper modal structure with backdrop', () => {
      const { container } = render(<ShareModal {...defaultProps} />);
      const backdrop = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have focusable close buttons', () => {
      render(<ShareModal {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have readonly share URL input', () => {
      render(<ShareModal {...defaultProps} isPublic={true} shareToken="test-token" />);
      const input = screen.getByDisplayValue(/http/);
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveAttribute('type', 'text');
    });
  });
});
