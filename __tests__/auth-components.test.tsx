/**
 * Tests for authentication UI components
 * Task 19: Create authentication UI components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OTPInput } from '@/components/auth/OTPInput';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegistrationForm } from '@/components/auth/RegistrationForm';

describe('OTPInput Component', () => {
  it('should render 6 input boxes', () => {
    const mockOnChange = jest.fn();
    render(<OTPInput value="" onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('should call onChange when digits are entered', () => {
    const mockOnChange = jest.fn();
    render(<OTPInput value="" onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('1');
  });

  it('should only accept numeric input', () => {
    const mockOnChange = jest.fn();
    render(<OTPInput value="" onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    
    // Should not call onChange for non-numeric input
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should display the provided value', () => {
    const mockOnChange = jest.fn();
    render(<OTPInput value="123456" onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(inputs[2].value).toBe('3');
    expect(inputs[3].value).toBe('4');
    expect(inputs[4].value).toBe('5');
    expect(inputs[5].value).toBe('6');
  });
});

describe('LoginForm Component', () => {
  it('should render with credentials tab active by default', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should switch to OTP tab when clicked', async () => {
    render(<LoginForm />);
    
    const otpTab = screen.getByRole('tab', { name: /otp/i });
    fireEvent.click(otpTab);
    
    // Wait for the tab content to render
    await waitFor(() => {
      expect(screen.queryByLabelText('Mobile Number')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should validate username and password on submit', async () => {
    const mockLogin = jest.fn();
    render(<LoginForm onCredentialLogin={mockLogin} />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });

  it('should call onCredentialLogin with valid credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    render(<LoginForm onCredentialLogin={mockLogin} />);
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123', false);
    });
  });

  it('should call onCredentialLogin with remember me enabled', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    render(<LoginForm onCredentialLogin={mockLogin} />);
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    // Check remember me checkbox
    const rememberMeCheckbox = screen.getByLabelText('Remember me');
    fireEvent.click(rememberMeCheckbox);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123', true);
    });
  });

  it('should call onSuccess callback after successful login', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    const mockSuccess = jest.fn();
    render(<LoginForm onCredentialLogin={mockLogin} onSuccess={mockSuccess} />);
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
    });
  });

  it('should show improved error message for invalid credentials', async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm onCredentialLogin={mockLogin} />);
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });

  it('should handle keyboard navigation with Enter key', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    render(<LoginForm onCredentialLogin={mockLogin} />);
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(usernameInput, {
      target: { value: 'testuser' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });
    
    // Press Enter on password field
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123', false);
    });
  });

  it('should show OTP input after requesting OTP', async () => {
    const mockOTPRequest = jest.fn().mockResolvedValue(undefined);
    render(<LoginForm onOTPRequest={mockOTPRequest} />);
    
    // Switch to OTP tab
    const otpTab = screen.getByRole('tab', { name: /otp/i });
    fireEvent.click(otpTab);
    
    // Wait for tab content to render
    await waitFor(() => {
      expect(screen.queryByLabelText('Mobile Number')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Enter mobile number
    fireEvent.change(screen.getByLabelText('Mobile Number'), {
      target: { value: '+1234567890' },
    });
    
    // Click send OTP
    const sendButton = screen.getByRole('button', { name: /send otp/i });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockOTPRequest).toHaveBeenCalledWith('+1234567890');
      expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();
    });
  });
});

describe('RegistrationForm Component', () => {
  it('should render with credentials tab active by default', () => {
    render(<RegistrationForm />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('should switch to mobile tab when clicked', async () => {
    render(<RegistrationForm />);
    
    const mobileTab = screen.getByRole('tab', { name: /mobile/i });
    fireEvent.click(mobileTab);
    
    // Wait for the tab content to render
    await waitFor(() => {
      expect(screen.queryByLabelText('Mobile Number')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should validate password confirmation', async () => {
    const mockRegister = jest.fn();
    render(<RegistrationForm onCredentialRegister={mockRegister} />);
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'different' },
    });
    
    const submitButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should call onCredentialRegister with valid data', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    render(<RegistrationForm onCredentialRegister={mockRegister} />);
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });
    
    const submitButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('testuser', 'password123', undefined);
    });
  });

  it('should call onMobileRegister with valid mobile number', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    render(<RegistrationForm onMobileRegister={mockRegister} />);
    
    // Switch to mobile tab
    const mobileTab = screen.getByRole('tab', { name: /mobile/i });
    fireEvent.click(mobileTab);
    
    // Wait for tab content to render
    await waitFor(() => {
      expect(screen.queryByLabelText('Mobile Number')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Enter mobile number
    fireEvent.change(screen.getByLabelText('Mobile Number'), {
      target: { value: '+1234567890' },
    });
    
    const submitButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('+1234567890');
    });
  });
});
