'use client';

import { useState } from 'react';
import { AdminBusinessIdeasManager } from '@/components/admin/AdminBusinessIdeasManager';
import { AdminBusinessIdeaForm, BusinessIdeaFormData } from '@/components/admin/AdminBusinessIdeaForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

export default function AdminBusinessIdeasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<BusinessIdea | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Protect the page - redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push('/auth-demo');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
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
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  const handleCreate = () => {
    setEditingIdea(null);
    setIsFormOpen(true);
  };

  const handleEdit = (idea: BusinessIdea) => {
    setEditingIdea(idea);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const token = localStorage.getItem('auth_session_token');
      const response = await fetch(`/api/business-ideas/${deletingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Business idea deleted successfully');
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(data.error?.message || 'Failed to delete business idea');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred while deleting');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (formData: BusinessIdeaFormData) => {
    try {
      const token = localStorage.getItem('auth_session_token');
      const url = editingIdea
        ? `/api/business-ideas/${editingIdea.id}`
        : '/api/business-ideas';
      const method = editingIdea ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingIdea
            ? 'Business idea updated successfully'
            : 'Business idea created successfully'
        );
        setIsFormOpen(false);
        setEditingIdea(null);
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(data.error?.message || 'Failed to save business idea');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An error occurred while saving');
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8 px-4">
        <AdminBusinessIdeasManager
          key={refreshKey}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIdea ? 'Edit Business Idea' : 'Create New Business Idea'}
              </DialogTitle>
              <DialogDescription>
                {editingIdea
                  ? 'Update the business idea details below.'
                  : 'Fill in the details to create a new business idea.'}
              </DialogDescription>
            </DialogHeader>
            <AdminBusinessIdeaForm
              businessIdea={editingIdea}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingIdea(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this business idea? This action
                cannot be undone and will also delete all associated partnership
                requests.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingId(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}
