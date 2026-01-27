'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { RichTextEditor } from './RichTextEditor';
import { authenticatedFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import type { SubmissionData } from '@/schemas/anonymous-submission.schema';

interface AdminSubmissionDetailProps {
  submissionId: string;
}

export function AdminSubmissionDetail({ submissionId }: AdminSubmissionDetailProps) {
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    budgetMin: 0,
    budgetMax: 0,
    contactEmail: '',
    contactPhone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Approve dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(
        `/api/admin/submissions/${submissionId}`
      );
      const data = await response.json();

      if (data.success) {
        const submissionData = data.data.submission || data.data;
        setSubmission(submissionData);
        // Initialize edit data
        setEditData({
          title: submissionData.title,
          description: submissionData.description,
          budgetMin: submissionData.budgetMin,
          budgetMax: submissionData.budgetMax,
          contactEmail: submissionData.contactEmail || '',
          contactPhone: submissionData.contactPhone || '',
        });
      } else {
        setError(data.error?.message || 'Failed to load submission');
      }
    } catch (err) {
      setError('An error occurred while loading the submission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);

      const response = await authenticatedFetch(
        `/api/admin/submissions/${submissionId}/approve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Submission approved', {
          description: 'The submission has been approved and published as a business idea.',
        });
        router.push('/admin/submissions');
      } else {
        toast.error('Approval failed', {
          description: data.error?.message || 'Failed to approve submission',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Approval failed', {
        description: 'An error occurred while approving the submission',
      });
    } finally {
      setIsApproving(false);
      setApproveDialogOpen(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);

      const response = await authenticatedFetch(
        `/api/admin/submissions/${submissionId}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: rejectionReason || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Submission rejected', {
          description: 'The submission has been rejected.',
        });
        router.push('/admin/submissions');
      } else {
        toast.error('Rejection failed', {
          description: data.error?.message || 'Failed to reject submission',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Rejection failed', {
        description: 'An error occurred while rejecting the submission',
      });
    } finally {
      setIsRejecting(false);
      setRejectDialogOpen(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);

      const response = await authenticatedFetch(
        `/api/admin/submissions/${submissionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSubmission(data.data);
        setIsEditMode(false);
        toast.success('Changes saved', {
          description: 'The submission has been updated.',
        });
      } else {
        toast.error('Save failed', {
          description: data.error?.message || 'Failed to save changes',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Save failed', {
        description: 'An error occurred while saving changes',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (submission) {
      setEditData({
        title: submission.title,
        description: submission.description,
        budgetMin: submission.budgetMin,
        budgetMax: submission.budgetMax,
        contactEmail: submission.contactEmail || '',
        contactPhone: submission.contactPhone || '',
      });
    }
    setIsEditMode(false);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBudget = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATED: 'Created',
      EDITED: 'Edited',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      FLAGGED: 'Flagged',
      UNFLAGGED: 'Unflagged',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      EDITED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      FLAGGED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      UNFLAGGED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    return colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <div className="border rounded-xl p-8 space-y-6 bg-card shadow-sm">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border">
          <h1 className="text-3xl font-bold tracking-tight">Submission Details</h1>
          <Button variant="outline" onClick={() => router.push('/admin/submissions')} className="shrink-0">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Queue
          </Button>
        </div>
        <div className="p-12 border rounded-xl text-center bg-card shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">{error || 'Submission not found'}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            There was a problem loading the submission. This might be a temporary issue. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={fetchSubmission} className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/submissions')}>
              Back to Queue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPending = submission.status === 'PENDING';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Submission Details</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submitted {formatDate(submission.submittedAt)}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/submissions')}
          className="shrink-0"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Queue
        </Button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full shadow-sm transition-all ${
            submission.status === 'PENDING'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : submission.status === 'APPROVED'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            submission.status === 'PENDING'
              ? 'bg-blue-600 dark:bg-blue-400'
              : submission.status === 'APPROVED'
              ? 'bg-green-600 dark:bg-green-400'
              : 'bg-red-600 dark:bg-red-400'
          }`} />
          {submission.status}
        </span>
        {submission.flaggedForReview && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Flagged for Review
          </span>
        )}
      </div>

      {/* Flagged Warning */}
      {submission.flaggedForReview && submission.flagReason && (
        <div className="p-5 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Flagged for Review</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">{submission.flagReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="details" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Details
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Images ({submission.images?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Audit Log ({submission.auditLogs?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-8 mt-6">
          <div className="border rounded-xl p-8 space-y-8 bg-card shadow-sm">
            {/* Edit Mode Toggle */}
            {isPending && !isEditMode && (
              <div className="flex justify-end pb-4 border-b border-border">
                <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)} className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Submission
                </Button>
              </div>
            )}

            {/* Title */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Title</Label>
              {isEditMode ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Enter title"
                  className="text-lg font-medium"
                />
              ) : (
                <h2 className="text-2xl font-bold tracking-tight">{submission.title}</h2>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</Label>
              {isEditMode ? (
                <RichTextEditor
                  content={editData.description}
                  onChange={(html) => setEditData({ ...editData, description: html })}
                  placeholder="Enter description"
                />
              ) : (
                <div
                  className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-foreground prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: submission.description }}
                />
              )}
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {isEditMode ? 'Minimum Budget' : 'Budget Range'}
                </Label>
                {isEditMode ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.budgetMin}
                    onChange={(e) =>
                      setEditData({ ...editData, budgetMin: parseFloat(e.target.value) || 0 })
                    }
                  />
                ) : (
                  <p className="text-xl font-semibold text-primary">{formatBudget(submission.budgetMin, submission.budgetMax)}</p>
                )}
              </div>
              {isEditMode && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Maximum Budget</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.budgetMax}
                    onChange={(e) =>
                      setEditData({ ...editData, budgetMax: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-6 pt-6 border-t border-border">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                  {isEditMode ? (
                    <Input
                      type="email"
                      value={editData.contactEmail}
                      onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })}
                      placeholder="email@example.com"
                    />
                  ) : (
                    <p className="text-base">{submission.contactEmail || <span className="text-muted-foreground italic">Not provided</span>}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                  {isEditMode ? (
                    <Input
                      type="tel"
                      value={editData.contactPhone}
                      onChange={(e) => setEditData({ ...editData, contactPhone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  ) : (
                    <p className="text-base">{submission.contactPhone || <span className="text-muted-foreground italic">Not provided</span>}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-6 pt-6 border-t border-border">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Timestamps
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Submitted At</Label>
                  <p className="text-base">{formatDate(submission.submittedAt)}</p>
                </div>
                {submission.reviewedAt && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Reviewed At</Label>
                    <p className="text-base">{formatDate(submission.reviewedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Reason */}
            {submission.status === 'REJECTED' && submission.rejectionReason && (
              <div className="space-y-3 pt-6 border-t border-border">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Rejection Reason</Label>
                <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">{submission.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Edit Mode Actions */}
            {isEditMode && (
              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isPending && !isEditMode && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 bg-muted/50 rounded-xl border border-border">
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
                size="lg"
                className="gap-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Submission
              </Button>
              <Button 
                onClick={() => setApproveDialogOpen(true)}
                size="lg"
                className="gap-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approve & Publish
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="mt-6">
          <div className="border rounded-xl p-8 bg-card shadow-sm">
            {submission.images && submission.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {submission.images.map((img, index) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-lg">
                    {index === 0 && (
                      <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Primary
                      </div>
                    )}
                    <div className="aspect-square bg-muted relative">
                      <Image
                        src={`/api/images/${img.imageId}?variant=thumbnail`}
                        alt={img.image.filename}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                        loading="lazy"
                        quality={75}
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-3 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {img.image.filename}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-muted-foreground font-medium">No images uploaded</p>
                <p className="text-sm text-muted-foreground/70 mt-1">This submission doesn't have any images attached</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-6">
          <div className="border rounded-xl p-8 bg-card shadow-sm">
            {submission.auditLogs && submission.auditLogs.length > 0 ? (
              <div className="space-y-4">
                {submission.auditLogs.map((log, index) => (
                  <div key={log.id} className={`flex gap-4 pb-6 ${index !== (submission.auditLogs?.length ?? 0) - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex-shrink-0 pt-1">
                      <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-sm font-semibold">
                            {log.user?.name || log.user?.username || 'System'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs bg-muted/50 p-3 rounded-lg border border-border">
                          <pre className="whitespace-pre-wrap font-mono text-muted-foreground">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-muted-foreground font-medium">No audit log entries</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Activity history will appear here</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <DialogTitle className="text-xl">Approve Submission</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Are you sure you want to approve this submission? It will be published as a public business idea and become visible to all users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isApproving}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving} className="gap-2">
              {isApproving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Approving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve & Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <DialogTitle className="text-xl">Reject Submission</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Are you sure you want to reject this submission? You can optionally provide feedback to help the submitter improve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label htmlFor="rejection-reason" className="text-sm font-semibold">
                Rejection Reason (Optional)
              </Label>
              <textarea
                id="rejection-reason"
                className="w-full min-h-[120px] px-4 py-3 text-sm border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background"
                placeholder="Provide constructive feedback for the submitter..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground flex justify-between">
                <span>This feedback will be shared with the submitter</span>
                <span>{rejectionReason.length}/1000</span>
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isRejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting} className="gap-2">
              {isRejecting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Rejecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Submission
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
