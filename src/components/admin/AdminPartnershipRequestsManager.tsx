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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnershipRequestStatusSelector } from './PartnershipRequestStatusSelector';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api-client';

type PartnershipStatus = 'PENDING' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED';
type PartnershipRole = 'HELPER' | 'OUTLET';

interface PartnershipRequest {
  id: string;
  businessIdeaId: string;
  name: string;
  phoneNumber: string;
  role: PartnershipRole;
  status: PartnershipStatus;
  createdAt: string;
  businessIdea: {
    id: string;
    title: string;
  };
}

const roleLabels: Record<PartnershipRole, string> = {
  HELPER: 'Helper',
  OUTLET: 'Outlet',
};

export function AdminPartnershipRequestsManager() {
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Filter states
  const [businessIdeaFilter, setBusinessIdeaFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Unique business ideas for filter dropdown
  const [businessIdeas, setBusinessIdeas] = useState<
    Array<{ id: string; title: string }>
  >([]);

  const fetchPartnershipRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (businessIdeaFilter !== 'all') {
        params.append('businessIdeaId', businessIdeaFilter);
      }
      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await authenticatedFetch(
        `/api/partnership-requests?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setRequests(data.data);

        // Extract unique business ideas for filter
        const uniqueIdeas = Array.from(
          new Map(
            data.data.map((req: PartnershipRequest) => [
              req.businessIdea.id,
              req.businessIdea,
            ])
          ).values()
        ) as Array<{ id: string; title: string }>;
        setBusinessIdeas(uniqueIdeas);
      } else {
        setError('Failed to load partnership requests');
      }
    } catch (err) {
      setError('An error occurred while loading partnership requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnershipRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessIdeaFilter, roleFilter, statusFilter]);

  const handleStatusChange = async (
    requestId: string,
    newStatus: PartnershipStatus
  ) => {
    try {
      setUpdatingStatus(requestId);

      const response = await authenticatedFetch(`/api/partnership-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: newStatus } : req
          )
        );
        toast.success('Status updated successfully');
      } else {
        toast.error(data.error?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while updating status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-4 items-center">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
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
          <h2 className="text-2xl font-bold">Partnership Requests</h2>
        </div>
        <div className="p-8 border rounded-lg text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the partnership requests. Please try again.
          </p>
          <Button onClick={fetchPartnershipRequests}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Partnership Requests</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Business Idea:</label>
          <Select value={businessIdeaFilter} onValueChange={setBusinessIdeaFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Business Ideas</SelectItem>
              {businessIdeas.map((idea) => (
                <SelectItem key={idea.id} value={idea.id}>
                  {idea.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Role:</label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="HELPER">Helper</SelectItem>
              <SelectItem value="OUTLET">Outlet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">
            No partnership requests found.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Idea</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.businessIdea.title}
                  </TableCell>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>{request.phoneNumber}</TableCell>
                  <TableCell>{roleLabels[request.role]}</TableCell>
                  <TableCell>
                    <PartnershipRequestStatusSelector
                      requestId={request.id}
                      currentStatus={request.status}
                      onStatusChange={handleStatusChange}
                      disabled={updatingStatus === request.id}
                    />
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Showing {requests.length} request(s)
      </div>
    </div>
  );
}
