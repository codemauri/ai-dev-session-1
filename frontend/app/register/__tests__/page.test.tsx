import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import RegisterPage from '../page';
import { authApi } from '@/lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock authApi
jest.mock('@/lib/api', () => ({
  authApi: {
    register: jest.fn(),
  },
}));

describe('RegisterPage', () => {
  let mockPush: jest.Mock;
  let mockRefresh: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    mockRefresh = jest.fn();
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it('should render registration form', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Join Recipe Manager today')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should have link to login page', () => {
    render(<RegisterPage />);

    const signInLink = screen.getByText('Sign in');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('should have link to home page', () => {
    render(<RegisterPage />);

    const homeLink = screen.getByText(/back to home/i);
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should update form inputs', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const fullNameInput = screen.getByLabelText('Full Name (Optional)') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password$/) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;

    await user.type(fullNameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    expect(fullNameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    (authApi.register as jest.Mock).mockResolvedValueOnce({
      user: {
        id: 1,
        email: 'john@example.com',
        full_name: 'John Doe',
      },
      access_token: 'test-token',
      token_type: 'bearer',
    });

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<RegisterPage />);

    await user.type(screen.getByLabelText('Full Name (Optional)'), 'John Doe');
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        full_name: 'John Doe',
      });
      expect((window as any).location.href).toBe('/');
    });
  });

  it('should submit form without full name (optional field)', async () => {
    const user = userEvent.setup();
    (authApi.register as jest.Mock).mockResolvedValueOnce({
      user: {
        id: 1,
        email: 'john@example.com',
        full_name: null,
      },
      access_token: 'test-token',
      token_type: 'bearer',
    });

    render(<RegisterPage />);

    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        full_name: undefined,
      });
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    (authApi.register as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<RegisterPage />);

    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    expect(authApi.register).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });

    expect(authApi.register).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should display error message on registration failure', async () => {
    const user = userEvent.setup();
    (authApi.register as jest.Mock).mockRejectedValueOnce(
      new Error('API Error 400: Email already exists')
    );

    render(<RegisterPage />);

    await user.type(screen.getByLabelText('Email Address'), 'existing@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('API Error 400: Email already exists')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('should clear error when retrying after validation failure', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    // First attempt - passwords don't match
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    // Second attempt - fix passwords
    (authApi.register as jest.Mock).mockResolvedValueOnce({
      user: { id: 1, email: 'john@example.com' },
      access_token: 'test-token',
      token_type: 'bearer',
    });

    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });
  });

  it('should require email and password fields', () => {
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText(/^Password$/);
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(confirmPasswordInput).toBeRequired();
  });

  it('should have minimum password length of 8', () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/^Password$/) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;

    expect(passwordInput).toHaveAttribute('minLength', '8');
    expect(confirmPasswordInput).toHaveAttribute('minLength', '8');
  });

  it('should show password requirement hint', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Minimum 8 characters')).toBeInTheDocument();
  });
});
