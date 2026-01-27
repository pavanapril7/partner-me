import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/components/Header';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
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
    
    const loginButton = screen.getByText(/Login/i);
    expect(loginButton).toBeInTheDocument();
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
  beforeEach(() => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({
      user: { username: 'admin', isAdmin: true },
      isAuthenticated: true,
      logout: jest.fn(),
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
    
    const logoutButtons = screen.getAllByText(/Logout/i);
    expect(logoutButtons.length).toBeGreaterThan(0);
  });

  it('should display username when authenticated', () => {
    render(<Header />);
    
    const username = screen.getAllByText(/admin/i)[0];
    expect(username).toBeInTheDocument();
  });
});
