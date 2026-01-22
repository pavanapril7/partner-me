'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface BusinessIdeasListProps {
  businessIdeas: BusinessIdea[];
}

export function BusinessIdeasList({ businessIdeas }: BusinessIdeasListProps) {
  if (businessIdeas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No business ideas available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businessIdeas.map((idea, index) => (
        <Link key={idea.id} href={`/business-ideas/${idea.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="p-0">
              {idea.images.length > 0 && (
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-muted">
                  <Image
                    src={idea.images[0]}
                    alt={idea.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading={index < 3 ? 'eager' : 'lazy'}
                    priority={index < 3}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="text-xl">{idea.title}</CardTitle>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
