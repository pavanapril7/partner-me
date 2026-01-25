/**
 * Tests for the public submission page
 */

import { render, screen } from '@testing-library/react';
import SubmitPage from '@/app/submit/page';

// Mock the AnonymousSubmissionForm component
jest.mock('@/components/business-ideas/AnonymousSubmissionForm', () => ({
  AnonymousSubmissionForm: () => <div data-testid="anonymous-submission-form">Form</div>,
}));

// Mock the ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Submit Page', () => {
  it('renders the page title', () => {
    render(<SubmitPage />);
    expect(screen.getByText('Submit Your Business Idea')).toBeInTheDocument();
  });

  it('renders the page description', () => {
    render(<SubmitPage />);
    expect(
      screen.getByText(/Have an innovative business idea\? Share it with us!/i)
    ).toBeInTheDocument();
  });

  it('renders the "How It Works" section', () => {
    render(<SubmitPage />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('renders the submission guidelines', () => {
    render(<SubmitPage />);
    expect(screen.getByText('Submission Guidelines')).toBeInTheDocument();
    expect(screen.getByText(/Be Clear and Detailed:/i)).toBeInTheDocument();
    expect(screen.getByText(/Include Quality Images:/i)).toBeInTheDocument();
    expect(screen.getByText(/Provide Contact Information:/i)).toBeInTheDocument();
    expect(screen.getByText(/Realistic Budget:/i)).toBeInTheDocument();
    expect(screen.getByText(/Submission Limits:/i)).toBeInTheDocument();
  });

  it('renders the submission form', () => {
    render(<SubmitPage />);
    expect(screen.getByTestId('anonymous-submission-form')).toBeInTheDocument();
  });

  it('renders the privacy notice', () => {
    render(<SubmitPage />);
    expect(
      screen.getByText(/By submitting your idea, you agree to our terms of service/i)
    ).toBeInTheDocument();
  });

  it('renders the form card with proper title', () => {
    render(<SubmitPage />);
    expect(screen.getByText('Your Business Idea')).toBeInTheDocument();
    expect(
      screen.getByText('Fill out the form below to submit your idea for review')
    ).toBeInTheDocument();
  });

  it('displays the three-step process', () => {
    render(<SubmitPage />);
    
    // Check for step numbers
    const stepNumbers = screen.getAllByText(/^[1-3]$/);
    expect(stepNumbers).toHaveLength(3);
    
    // Check for step descriptions
    expect(
      screen.getByText(/Fill out the form below with your business idea details/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Our team will review your submission within 2-3 business days/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Once approved, your idea will be published on our platform/i)
    ).toBeInTheDocument();
  });
});
