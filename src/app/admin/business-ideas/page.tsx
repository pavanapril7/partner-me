'use client';

import { useState } from 'react';
import { AdminBusinessIdeasManager } from '@/components/admin/AdminBusinessIdeasManager';
import { AdminBusinessIdeaForm, BusinessIdeaFormData } from '@/components/admin/AdminBusinessIdeaForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api-client';

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

function AdminBusinessIdeasContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<BusinessIdea | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setEditingIdea(null);
    setIsFormOpen(true);
  };

  const handleEdit = async (idea: BusinessIdea) => {
    try {
      // Fetch full business idea details including uploaded images
      const response = await fetch(`/api/business-ideas/${idea.id}`);
      const data = await response.json();

      if (data.success) {
        console.log('Fetched full business idea for edit:', data.data);
        setEditingIdea(data.data);
        setIsFormOpen(true);
      } else {
        toast.error('Failed to load business idea details');
      }
    } catch (error) {
      console.error('Error fetching business idea:', error);
      toast.error('An error occurred while loading business idea');
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await authenticatedFetch(`/api/business-ideas/${deletingId}`, {
        method: 'DELETE',
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
      const url = editingIdea
        ? `/api/business-ideas/${editingIdea.id}`
        : '/api/business-ideas';
      const method = editingIdea ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
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
                cannot be undone and will permanently delete all associated images,
                partnership requests, and data.
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

export default function AdminBusinessIdeasPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminBusinessIdeasContent />
    </ProtectedRoute>
  );
}
