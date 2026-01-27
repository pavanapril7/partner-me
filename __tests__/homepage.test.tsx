import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';
import { HeroSection } from '@/components/HeroSection';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Homepage', () => {
  it('should render the homepage with HeroSection', () => {
    render(<Home />);
    
    // Check if main element exists
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});

describe('HeroSection Component', () => {
  it('should render the hero heading', () => {
    render(<HeroSection />);
    
    const heading = screen.getByText(/Find Your Perfect Business Partner/i);
    expect(heading).toBeInTheDocument();
  });

  it('should render the hero description', () => {
    render(<HeroSection />);
    
    const description = screen.getByText(/Discover innovative business ideas/i);
    expect(description).toBeInTheDocument();
  });

  it('should render CTA buttons', () => {
    render(<HeroSection />);
    
    const exploreButton = screen.getByText(/Explore Ideas/i);
    const submitButton = screen.getByText(/Submit Your Idea/i);
    
    expect(exploreButton).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it('should render feature highlights', () => {
    render(<HeroSection />);
    
    const innovativeIdeas = screen.getByText(/Innovative Ideas/i);
    const findPartners = screen.getByText(/Find Partners/i);
    const launchTogether = screen.getByText(/Launch Together/i);
    
    expect(innovativeIdeas).toBeInTheDocument();
    expect(findPartners).toBeInTheDocument();
    expect(launchTogether).toBeInTheDocument();
  });

  it('should have proper link hrefs', () => {
    render(<HeroSection />);
    
    const exploreLink = screen.getByText(/Explore Ideas/i).closest('a');
    const submitLink = screen.getByText(/Submit Your Idea/i).closest('a');
    
    expect(exploreLink).toHaveAttribute('href', '/business-ideas');
    expect(submitLink).toHaveAttribute('href', '/submit');
  });
});
