'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { authenticatedFetch } from '@/lib/api-client';
import type { SubmissionData, PaginatedSubmissions } from '@/schemas/anonymous-submission.schema';

export function AdminModerationQueue() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [contactFilter, setContactFilter] = useState<string>('all');
  const [flaggedFilter, setFlaggedFilter] = useState<string>('all');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, dateFrom, dateTo, contactFilter, flaggedFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (dateFrom) {
        params.append('dateFrom', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        params.append('dateTo', new Date(dateTo).toISOString());
      }
      if (contactFilter !== 'all') {
        params.append('hasContact', contactFilter);
      }
      if (flaggedFilter !== 'all') {
        params.append('flagged', flaggedFilter);
      }

      const response = await authenticatedFetch(
        `/api/admin/submissions/pending?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        const result = data.data as PaginatedSubmissions;
        setSubmissions(result.submissions);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
      } else {
        setError(data.error?.message || 'Failed to load submissions');
      }
    } catch (err) {
      setError('An error occurred while loading submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setContactFilter('all');
    setFlaggedFilter('all');
    setPage(1);
  };

  const handleViewSubmission = (submissionId: string) => {
    router.push(`/admin/submissions/${submissionId}`);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const truncateText = (text: string, maxLength: number) => {
    // Strip HTML tags for display
    const stripped = text.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  const getContactInfo = (submission: SubmissionData) => {
    const parts = [];
    if (submission.contactEmail) {
      parts.push(submission.contactEmail);
    }
    if (submission.contactPhone) {
      parts.push(submission.contactPhone);
    }
    return parts.length > 0 ? parts.join(', ') : 'No contact info';
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-4 flex-wrap">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <div className="border rounded-lg p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 flex-1" />
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
          <h2 className="text-2xl font-bold">Moderation Queue</h2>
        </div>
        <div className="p-8 border rounded-lg text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the submissions. Please try again.
          </p>
          <Button onClick={fetchSubmissions}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Moderation Queue</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input
            type="text"
            placeholder="Search title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div>
            <label className="text-sm font-medium mb-2 block">From Date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">To Date</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Contact Status</label>
          <Select value={contactFilter} onValueChange={setContactFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Has Contact</SelectItem>
              <SelectItem value="false">No Contact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Flagged</label>
          <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Flagged Only</SelectItem>
              <SelectItem value="false">Not Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Submission count */}
      <div className="text-sm text-muted-foreground">
        Showing {submissions.length} of {totalCount} submission(s)
      </div>

      {/* Submissions table */}
      {submissions.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">
            No pending submissions found.
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Budget Range</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.title}
                      {submission.flaggedForReview && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Flagged
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">
                      {truncateText(submission.description, 100)}
                    </TableCell>
                    <TableCell>
                      {formatBudget(submission.budgetMin, submission.budgetMax)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {getContactInfo(submission)}
                    </TableCell>
                    <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {submission.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSubmission(submission.id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
