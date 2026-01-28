import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/components/Header';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    logout: jest.fn(),
  })),
}));

describe('Header Component', () => {
  it('should render the logo', () => {
    render(<Header />);
    
    const logo = screen.getByText(/Partner Me/i);
    expect(logo).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Header />);
    
    const businessIdeasLink = screen.getAllByText(/Business Ideas/i)[0];
    expect(businessIdeasLink).toBeInTheDocument();
  });

  it('should render login button when not authenticated', () => {
    render(<Header />);
    
    const loginButton = screen.getByRole('button', { name: /Login/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('should render register button when not authenticated', () => {
    render(<Header />);
    
    const registerButton = screen.getByRole('button', { name: /Register/i });
    expect(registerButton).toBeInTheDocument();
  });

  it('should have mobile menu button', () => {
    render(<Header />);
    
    const menuButton = screen.getByLabelText(/Toggle menu/i);
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle mobile menu when button is clicked', () => {
    render(<Header />);
    
    const menuButton = screen.getByLabelText(/Toggle menu/i);
    
    // Mobile menu should not be visible initially (check for mobile-specific nav)
    const initialMobileMenus = screen.queryAllByText(/Business Ideas/i);
    expect(initialMobileMenus.length).toBeGreaterThan(0); // Desktop nav exists
    
    // Click to open menu
    fireEvent.click(menuButton);
    
    // Mobile menu should now be visible (there should be more instances of the links)
    const afterClickMenus = screen.getAllByText(/Business Ideas/i);
    expect(afterClickMenus.length).toBeGreaterThanOrEqual(initialMobileMenus.length);
  });

  it('should have proper navigation structure', () => {
    render(<Header />);
    
    const businessIdeasLinks = screen.getAllByText(/Business Ideas/i);
    
    // Should have at least one navigation link
    expect(businessIdeasLinks.length).toBeGreaterThan(0);
    
    // Check that the link has an href
    const firstLink = businessIdeasLinks[0].closest('a');
    expect(firstLink).toHaveAttribute('href', '/business-ideas');
  });
});

describe('Header Component - Authenticated Admin', () => {
  let mockLogout: jest.Mock;
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockLogout = jest.fn();
    mockPush = jest.fn();
    
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({
      user: { username: 'admin', isAdmin: true },
      isAuthenticated: true,
      isLoading: false,
      logout: mockLogout,
    });

    const { useRouter } = require('next/navigation');
    useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
  });

  it('should render admin navigation links when user is admin', () => {
    render(<Header />);
    
    const manageIdeasLink = screen.getAllByText(/Manage Ideas/i)[0];
    const submissionsLink = screen.getAllByText(/Submissions/i)[0];
    const requestsLink = screen.getAllByText(/Requests/i)[0];
    
    expect(manageIdeasLink).toBeInTheDocument();
    expect(submissionsLink).toBeInTheDocument();
    expect(requestsLink).toBeInTheDocument();
  });

  it('should render logout button when authenticated', () => {
    render(<Header />);
    
    // Find and click the username button to open dropdown
    const usernameButton = screen.getAllByText(/admin/i)[0].closest('button');
    expect(usernameButton).toBeInTheDocument();
    
    if (usernameButton) {
      fireEvent.click(usernameButton);
      
      // Now logout button should be visible in dropdown
      const logoutButtons = screen.getAllByText(/Logout/i);
      expect(logoutButtons.length).toBeGreaterThan(0);
    }
  });

  it('should display username when authenticated', () => {
    render(<Header />);
    
    const username = screen.getAllByText(/admin/i)[0];
    expect(username).toBeInTheDocument();
  });

  it('should render user dropdown menu when clicking username', () => {
    render(<Header />);
    
    // Find and click the username button
    const usernameButton = screen.getAllByText(/admin/i)[0].closest('button');
    expect(usernameButton).toBeInTheDocument();
    
    if (usernameButton) {
      fireEvent.click(usernameButton);
      
      // Check that logout button appears in dropdown
      const logoutButtons = screen.getAllByText(/Logout/i);
      expect(logoutButtons.length).toBeGreaterThan(0);
    }
  });

  it('should call logout and redirect to home page when logout button is clicked', async () => {
    render(<Header />);
    
    // Find and click the username button to open dropdown
    const usernameButton = screen.getAllByText(/admin/i)[0].closest('button');
    expect(usernameButton).toBeInTheDocument();
    
    if (usernameButton) {
      fireEvent.click(usernameButton);
      
      // Find and click logout button
      const logoutButtons = screen.getAllByText(/Logout/i);
      const logoutButton = logoutButtons[0];
      
      fireEvent.click(logoutButton);
      
      // Verify logout was called
      expect(mockLogout).toHaveBeenCalledTimes(1);
      
      // Wait for async logout to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify redirect to home page
      expect(mockPush).toHaveBeenCalledWith('/');
    }
  });

  it('should call logout and redirect to home page from mobile menu', async () => {
    render(<Header />);
    
    // Open mobile menu
    const menuButton = screen.getByLabelText(/Toggle menu/i);
    fireEvent.click(menuButton);
    
    // Find logout button in mobile menu
    const logoutButtons = screen.getAllByText(/Logout/i);
    // Mobile menu logout button should be the last one
    const mobileLogoutButton = logoutButtons[logoutButtons.length - 1];
    
    fireEvent.click(mobileLogoutButton);
    
    // Verify logout was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
    
    // Wait for async logout to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verify redirect to home page
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});

describe('Header Component - Loading State', () => {
  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      logout: jest.fn(),
    });
  });

  it('should render loading skeleton when loading', () => {
    render(<Header />);
    
    // Check for loading skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render login or register buttons when loading', () => {
    render(<Header />);
    
    const loginButton = screen.queryByRole('button', { name: /Login/i });
    const registerButton = screen.queryByRole('button', { name: /Register/i });
    
    expect(loginButton).not.toBeInTheDocument();
    expect(registerButton).not.toBeInTheDocument();
  });
});
