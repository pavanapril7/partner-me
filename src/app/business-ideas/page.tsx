import { BusinessIdeasList } from '@/components/business-ideas/BusinessIdeasList';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  images: string[];
  budgetMin: number;
  budgetMax: number;
  createdAt: Date;
  updatedAt: Date;
}

async function getBusinessIdeas(): Promise<BusinessIdea[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/business-ideas`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch business ideas:', response.statusText);
      return [];
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching business ideas:', error);
    return [];
  }
}

export default async function BusinessIdeasPage() {
  const businessIdeas = await getBusinessIdeas();

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Business Ideas</h1>
          <p className="text-muted-foreground">
            Explore exciting business opportunities and find your next venture
          </p>
        </div>
        
        {businessIdeas.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No business ideas are currently available.
              </p>
              <p className="text-sm text-muted-foreground">
                Check back later for new opportunities!
              </p>
            </CardContent>
          </Card>
        ) : (
          <BusinessIdeasList businessIdeas={businessIdeas} />
        )}
      </div>
    </ErrorBoundary>
  );
}
