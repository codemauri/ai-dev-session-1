import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import Navigation from '../Navigation';
import { authApi, tokenManager } from '@/lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock authApi and tokenManager
jest.mock('@/lib/api', () => ({
  authApi: {
    getMe: jest.fn(),
    logout: jest.fn(),
  },
  tokenManager: {
    isAuthenticated: jest.fn(),
    removeToken: jest.fn(),
  },
}));

describe('Navigation', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it('should render navigation links', () => {
    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<Navigation />);

    expect(screen.getByText('Recipe Manager')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Grocery List')).toBeInTheDocument();
    expect(screen.getByText('Meal Plans')).toBeInTheDocument();
  });

  it('should show Sign In and Sign Up links when not authenticated', async () => {
    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    expect(screen.queryByText('+ Create Recipe')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should show user email and logout button when authenticated', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authApi.getMe as jest.Mock).mockResolvedValue(mockUser);

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText('+ Create Recipe')).toBeInTheDocument();
    });

    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
  });

  it('should load user data on mount when authenticated', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authApi.getMe as jest.Mock).mockResolvedValue(mockUser);

    render(<Navigation />);

    await waitFor(() => {
      expect(tokenManager.isAuthenticated).toHaveBeenCalled();
      expect(authApi.getMe).toHaveBeenCalled();
    });
  });

  it('should not call getMe when not authenticated', async () => {
    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<Navigation />);

    await waitFor(() => {
      expect(tokenManager.isAuthenticated).toHaveBeenCalled();
      expect(authApi.getMe).not.toHaveBeenCalled();
    });
  });

  it('should clear token and show sign in/up when getMe fails', async () => {
    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authApi.getMe as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    render(<Navigation />);

    await waitFor(() => {
      expect(tokenManager.removeToken).toHaveBeenCalled();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should handle logout correctly', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authApi.getMe as jest.Mock).mockResolvedValue(mockUser);

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    expect(authApi.logout).toHaveBeenCalled();
    expect((window as any).location.href).toBe('/');
  });

  it('should show Create Recipe link only when authenticated', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authApi.getMe as jest.Mock).mockResolvedValue(mockUser);

    render(<Navigation />);

    await waitFor(() => {
      const createRecipeLink = screen.getByText('+ Create Recipe');
      expect(createRecipeLink).toBeInTheDocument();
      expect(createRecipeLink).toHaveAttribute('href', '/recipes/new');
    });
  });

  it('should have correct links', () => {
    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<Navigation />);

    const homeLink = screen.getByText('Home');
    const categoriesLink = screen.getByText('Categories');
    const groceryListLink = screen.getByText('Grocery List');
    const mealPlansLink = screen.getByText('Meal Plans');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(categoriesLink).toHaveAttribute('href', '/categories');
    expect(groceryListLink).toHaveAttribute('href', '/grocery-list');
    expect(mealPlansLink).toHaveAttribute('href', '/meal-plans');
  });

  it('should not show auth UI while loading', () => {
    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authApi.getMe as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Navigation />);

    // While loading, auth UI should not be visible
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });
});
