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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Moderation Queue</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Review and manage pending submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 sm:gap-4 flex-wrap items-end bg-muted/30 p-3 sm:p-4 rounded-lg border">
        <div className="flex-1 min-w-[200px] max-w-full sm:max-w-md">
          <label className="text-xs sm:text-sm font-medium mb-2 block">Search</label>
          <Input
            type="text"
            placeholder="Search title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background h-10 sm:h-11"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium mb-2 block">From Date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[140px] md:w-[160px] bg-background h-10 sm:h-11"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium mb-2 block">To Date</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[140px] md:w-[160px] bg-background h-10 sm:h-11"
            />
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-xs sm:text-sm font-medium mb-2 block">Contact Status</label>
          <Select value={contactFilter} onValueChange={setContactFilter}>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[160px] bg-background h-10 sm:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Has Contact</SelectItem>
              <SelectItem value="false">No Contact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-xs sm:text-sm font-medium mb-2 block">Flagged</label>
          <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
            <SelectTrigger className="w-full sm:w-[120px] md:w-[140px] bg-background h-10 sm:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Flagged Only</SelectItem>
              <SelectItem value="false">Not Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto h-10 sm:h-11 touch-manipulation">
          Clear Filters
        </Button>
      </div>

      {/* Submission count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{submissions.length}</span> of{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> submission(s)
        </div>
        {totalPages > 1 && (
          <div className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of{' '}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </div>
        )}
      </div>

      {/* Submissions table */}
      {submissions.length === 0 ? (
        <div className="text-center p-8 sm:p-12 border rounded-lg bg-muted/20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-1">No pending submissions found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Title</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Description</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Budget Range</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">Contact</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Submitted</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right font-semibold text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow 
                    key={submission.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleViewSubmission(submission.id)}
                  >
                    <TableCell className="font-medium text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="line-clamp-2 min-w-0">{submission.title}</span>
                        {submission.flaggedForReview && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap shrink-0">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Flagged
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs hidden md:table-cell">
                      <span className="line-clamp-2 text-xs sm:text-sm text-muted-foreground">
                        {truncateText(submission.description, 100)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs sm:text-sm hidden lg:table-cell">
                      {formatBudget(submission.budgetMin, submission.budgetMax)}
                    </TableCell>
                    <TableCell className="max-w-[150px] hidden xl:table-cell">
                      <span className="line-clamp-1 text-xs sm:text-sm">
                        {getContactInfo(submission)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                      <span className="hidden sm:inline">{formatDate(submission.submittedAt)}</span>
                      <span className="sm:hidden">{new Date(submission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium whitespace-nowrap">
                        <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"></span>
                        <span className="hidden sm:inline">{submission.status}</span>
                        <span className="sm:hidden">P</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSubmission(submission.id);
                        }}
                        className="shadow-sm hover:shadow-md transition-shadow text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 touch-manipulation"
                      >
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="shadow-sm flex-1 sm:flex-initial h-10 sm:h-9 touch-manipulation"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="shadow-sm flex-1 sm:flex-initial h-10 sm:h-9 touch-manipulation"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
