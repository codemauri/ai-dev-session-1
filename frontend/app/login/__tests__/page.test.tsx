import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';
import { authApi } from '@/lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock authApi
jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

describe('LoginPage', () => {
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

  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back to Recipe Manager')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should have link to register page', () => {
    render(<LoginPage />);

    const signUpLink = screen.getByText('Sign up');
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('should have link to home page', () => {
    render(<LoginPage />);

    const homeLink = screen.getByText(/back to home/i);
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should update email and password inputs', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup();
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      access_token: 'test-token',
      token_type: 'bearer',
    });

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect((window as any).location.href).toBe('/');
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    (authApi.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    (authApi.login as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid email or password')
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('should clear error when retrying after failure', async () => {
    const user = userEvent.setup();
    (authApi.login as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid email or password')
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // First attempt - failure
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    // Second attempt - should clear error
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      access_token: 'test-token',
      token_type: 'bearer',
    });

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'correct@example.com');
    await user.type(passwordInput, 'correctpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
    });
  });

  it('should require email and password fields', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('should have minimum password length of 8', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    expect(passwordInput).toHaveAttribute('minLength', '8');
  });
});
