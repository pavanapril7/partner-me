'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authenticatedFetch } from '@/lib/api-client';
import type { SubmissionStats } from '@/schemas/anonymous-submission.schema';

// Icon components (simple SVG icons)
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export function AdminModerationDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await authenticatedFetch('/api/admin/submissions/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data as SubmissionStats);
      } else {
        setError(data.error?.message || 'Failed to load statistics');
      }
    } catch (err) {
      setError('An error occurred while loading statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQueue = () => {
    router.push('/admin/submissions');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Moderation Dashboard</h2>
        </div>
        <div className="p-8 border rounded-lg text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the statistics. Please try again.
          </p>
          <Button onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Moderation Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Overview of anonymous submission statistics
          </p>
        </div>
        <Button onClick={handleViewQueue} size="lg" className="w-full sm:w-auto shadow-md min-h-[48px] touch-manipulation">
          View Moderation Queue
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Pending Submissions</CardDescription>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ClockIcon />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Flagged for Review</CardDescription>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertIcon />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {stats.flaggedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Approved (30 days)</CardDescription>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircleIcon />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.approvedLast30Days}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
              Published ideas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Rejected (30 days)</CardDescription>
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <XCircleIcon />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-rose-600 dark:text-rose-400">
              {stats.rejectedLast30Days}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-rose-500 rounded-full"></span>
              Not published
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClockIcon />
              </div>
              <div>
                <CardTitle className="text-xl">Average Review Time</CardTitle>
                <CardDescription>
                  Time from submission to review decision
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold">
              {stats.averageReviewTimeHours.toFixed(1)}
              <span className="text-2xl font-normal text-muted-foreground ml-2">
                hours
              </span>
            </div>
            {stats.averageReviewTimeHours > 48 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertIcon />
                  Review time is above target (48 hours)
                </p>
              </div>
            )}
            {stats.averageReviewTimeHours <= 24 && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircleIcon />
                  Excellent response time
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ChartBarIcon />
              </div>
              <div>
                <CardTitle className="text-xl">30-Day Trends</CardTitle>
                <CardDescription>
                  Submission activity over the last month
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total Reviewed</span>
                <span className="text-2xl font-bold">
                  {stats.approvedLast30Days + stats.rejectedLast30Days}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUpIcon />
                  Approval Rate
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.approvedLast30Days + stats.rejectedLast30Days > 0
                    ? (
                        (stats.approvedLast30Days /
                          (stats.approvedLast30Days + stats.rejectedLast30Days)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">All-Time Approved</p>
                  <p className="text-xl font-bold">{stats.approved}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">All-Time Rejected</p>
                  <p className="text-xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Prompt */}
      {stats.pending > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 shadow-md">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="p-2 sm:p-3 bg-blue-500 text-white rounded-full shrink-0">
                  <ClockIcon />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg">
                    You have {stats.pending} submission{stats.pending !== 1 ? 's' : ''} waiting for review
                  </p>
                  {stats.flaggedCount > 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <AlertIcon />
                      {stats.flaggedCount} flagged for potential issues
                    </p>
                  )}
                </div>
              </div>
              <Button onClick={handleViewQueue} size="lg" className="w-full sm:w-auto shadow-md min-h-[48px] touch-manipulation">
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
