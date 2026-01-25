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
      CREATED: 'bg-blue-100 text-blue-800',
      EDITED: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      FLAGGED: 'bg-orange-100 text-orange-800',
      UNFLAGGED: 'bg-gray-100 text-gray-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Submission Details</h2>
          <Button variant="outline" onClick={() => router.push('/admin/submissions')}>
            Back to Queue
          </Button>
        </div>
        <div className="p-8 border rounded-lg text-center">
          <p className="text-destructive mb-4">{error || 'Submission not found'}</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the submission. Please try again.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchSubmission}>Retry</Button>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Submission Details</h2>
          <p className="text-sm text-muted-foreground">
            Submitted {formatDate(submission.submittedAt)}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/submissions')}>
          Back to Queue
        </Button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-3 py-1 rounded ${
            submission.status === 'PENDING'
              ? 'bg-blue-100 text-blue-800'
              : submission.status === 'APPROVED'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {submission.status}
        </span>
        {submission.flaggedForReview && (
          <span className="text-xs font-medium px-3 py-1 rounded bg-yellow-100 text-yellow-800">
            Flagged for Review
          </span>
        )}
      </div>

      {/* Flagged Warning */}
      {submission.flaggedForReview && submission.flagReason && (
        <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded">
          <p className="text-sm font-medium text-yellow-800">Flagged for Review</p>
          <p className="text-sm text-yellow-700 mt-1">{submission.flagReason}</p>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images ({submission.images?.length || 0})</TabsTrigger>
          <TabsTrigger value="audit">Audit Log ({submission.auditLogs?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="border rounded-lg p-6 space-y-6">
            {/* Edit Mode Toggle */}
            {isPending && !isEditMode && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                  Edit Submission
                </Button>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              {isEditMode ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Enter title"
                />
              ) : (
                <p className="text-lg font-medium">{submission.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              {isEditMode ? (
                <RichTextEditor
                  content={editData.description}
                  onChange={(html) => setEditData({ ...editData, description: html })}
                  placeholder="Enter description"
                />
              ) : (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: submission.description }}
                />
              )}
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Budget</Label>
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
                  <p className="text-lg">{formatBudget(submission.budgetMin, submission.budgetMax)}</p>
                )}
              </div>
              {isEditMode && (
                <div className="space-y-2">
                  <Label>Maximum Budget</Label>
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditMode ? (
                    <Input
                      type="email"
                      value={editData.contactEmail}
                      onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })}
                      placeholder="email@example.com"
                    />
                  ) : (
                    <p>{submission.contactEmail || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  {isEditMode ? (
                    <Input
                      type="tel"
                      value={editData.contactPhone}
                      onChange={(e) => setEditData({ ...editData, contactPhone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  ) : (
                    <p>{submission.contactPhone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Submitted At</Label>
                  <p>{formatDate(submission.submittedAt)}</p>
                </div>
                {submission.reviewedAt && (
                  <div className="space-y-2">
                    <Label>Reviewed At</Label>
                    <p>{formatDate(submission.reviewedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Reason */}
            {submission.status === 'REJECTED' && submission.rejectionReason && (
              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">{submission.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Edit Mode Actions */}
            {isEditMode && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isPending && !isEditMode && (
            <div className="flex justify-end gap-2">
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
              >
                Reject Submission
              </Button>
              <Button onClick={() => setApproveDialogOpen(true)}>
                Approve & Publish
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <div className="border rounded-lg p-6">
            {submission.images && submission.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {submission.images.map((img, index) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border-2 border-border">
                    {index === 0 && (
                      <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                        Primary
                      </div>
                    )}
                    <div className="aspect-square bg-muted relative">
                      <Image
                        src={`/api/images/${img.imageId}?variant=thumbnail`}
                        alt={img.image.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        loading="lazy"
                        quality={75}
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.image.filename}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No images uploaded</p>
            )}
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <div className="border rounded-lg p-6">
            {submission.auditLogs && submission.auditLogs.length > 0 ? (
              <div className="space-y-4">
                {submission.auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">
                          {log.user?.name || log.user?.username || 'System'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No audit log entries</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this submission? It will be published as a public business idea.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isApproving}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving ? 'Approving...' : 'Approve & Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this submission? You can optionally provide feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
              <textarea
                id="rejection-reason"
                className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Provide feedback for the submitter..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {rejectionReason.length}/1000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isRejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? 'Rejecting...' : 'Reject Submission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
