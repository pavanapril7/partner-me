import type { Metadata } from 'next';
import { AnonymousSubmissionForm } from '@/components/business-ideas/AnonymousSubmissionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Submit Your Business Idea | Business Ideas Platform',
  description: 'Share your innovative business idea with our community. Submit anonymously and get feedback from our team.',
  keywords: ['business ideas', 'submit idea', 'entrepreneurship', 'startup ideas', 'business proposal'],
  openGraph: {
    title: 'Submit Your Business Idea',
    description: 'Share your innovative business idea with our community',
    type: 'website',
  },
};

export default function SubmitPage() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-4xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3">Submit Your Business Idea</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Have an innovative business idea? Share it with us! No account required.
          </p>
        </div>

        {/* Information Card */}
        <Card className="mb-6 sm:mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">How It Works</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Your submission process in three simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    1
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base">Submit</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Fill out the form below with your business idea details, budget, and images.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    2
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base">Review</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Our team will review your submission within 2-3 business days.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    3
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base">Publish</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Once approved, your idea will be published on our platform for the community to see.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guidelines Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Submission Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  <strong>Be Clear and Detailed:</strong> Provide a comprehensive description of your business idea, including the problem it solves and target market.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  <strong>Include Quality Images:</strong> Upload at least one high-quality image that represents your idea (mockups, diagrams, or concept art).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  <strong>Provide Contact Information:</strong> Include at least one contact method (email or phone) so we can reach you about your submission.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  <strong>Realistic Budget:</strong> Provide a reasonable budget range for implementing your idea.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  <strong>Submission Limits:</strong> You can submit up to 3 ideas per day to ensure quality and prevent spam.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Business Idea</CardTitle>
            <CardDescription>
              Fill out the form below to submit your idea for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnonymousSubmissionForm />
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            By submitting your idea, you agree to our terms of service and privacy policy.
            Your contact information will only be used to communicate about your submission.
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}
