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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Moderation Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of anonymous submission statistics
          </p>
        </div>
        <Button onClick={handleViewQueue}>View Moderation Queue</Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flagged for Review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.flaggedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved (30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.approvedLast30Days}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Published ideas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected (30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.rejectedLast30Days}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Not published
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Review Time</CardTitle>
            <CardDescription>
              Time from submission to review decision
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats.averageReviewTimeHours.toFixed(1)}
              <span className="text-xl font-normal text-muted-foreground ml-2">
                hours
              </span>
            </div>
            {stats.averageReviewTimeHours > 48 && (
              <p className="text-sm text-yellow-600 mt-2">
                ⚠️ Review time is above target (48 hours)
              </p>
            )}
            {stats.averageReviewTimeHours <= 24 && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Excellent response time
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>30-Day Trends</CardTitle>
            <CardDescription>
              Submission activity over the last month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Reviewed</span>
                <span className="text-2xl font-bold">
                  {stats.approvedLast30Days + stats.rejectedLast30Days}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Approval Rate</span>
                <span className="text-2xl font-bold">
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
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">All-Time Approved</span>
                <span className="text-2xl font-bold">{stats.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">All-Time Rejected</span>
                <span className="text-2xl font-bold">{stats.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Prompt */}
      {stats.pending > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  You have {stats.pending} submission{stats.pending !== 1 ? 's' : ''} waiting for review
                </p>
                {stats.flaggedCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.flaggedCount} flagged for potential issues
                  </p>
                )}
              </div>
              <Button onClick={handleViewQueue}>Review Now</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
