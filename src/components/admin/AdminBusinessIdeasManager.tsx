'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  images: string[];
  budgetMin: number;
  budgetMax: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminBusinessIdeasManagerProps {
  onEdit: (idea: BusinessIdea) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function AdminBusinessIdeasManager({
  onEdit,
  onDelete,
  onCreate,
}: AdminBusinessIdeasManagerProps) {
  const [businessIdeas, setBusinessIdeas] = useState<BusinessIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinessIdeas();
  }, []);

  const fetchBusinessIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/business-ideas');
      const data = await response.json();

      if (data.success) {
        setBusinessIdeas(data.data);
      } else {
        setError('Failed to load business ideas');
      }
    } catch (err) {
      setError('An error occurred while loading business ideas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min: number, max: number) => {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    // Strip HTML tags for display
    const stripped = text.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="border rounded-lg p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Manage Business Ideas</h2>
          <Button onClick={onCreate}>Create New Business Idea</Button>
        </div>
        <div className="p-8 border rounded-lg text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the business ideas. Please try again.
          </p>
          <Button onClick={fetchBusinessIdeas}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Business Ideas</h2>
        <Button onClick={onCreate}>Create New Business Idea</Button>
      </div>

      {businessIdeas.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground mb-4">
            No business ideas yet. Create your first one!
          </p>
          <Button onClick={onCreate}>Create Business Idea</Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Budget Range</TableHead>
                <TableHead>Images</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessIdeas.map((idea) => (
                <TableRow key={idea.id}>
                  <TableCell className="font-medium">{idea.title}</TableCell>
                  <TableCell className="max-w-md">
                    {truncateText(idea.description, 100)}
                  </TableCell>
                  <TableCell>
                    {formatBudget(idea.budgetMin, idea.budgetMax)}
                  </TableCell>
                  <TableCell>{idea.images.length} image(s)</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(idea)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(idea.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
