'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PartnershipStatus = 'PENDING' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED';

interface PartnershipRequestStatusSelectorProps {
  requestId: string;
  currentStatus: PartnershipStatus;
  onStatusChange: (requestId: string, newStatus: PartnershipStatus) => void;
  disabled?: boolean;
}

const statusLabels: Record<PartnershipStatus, string> = {
  PENDING: 'Pending',
  CONTACTED: 'Contacted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

const statusColors: Record<PartnershipStatus, string> = {
  PENDING: 'text-yellow-600',
  CONTACTED: 'text-blue-600',
  ACCEPTED: 'text-green-600',
  REJECTED: 'text-red-600',
};

export function PartnershipRequestStatusSelector({
  requestId,
  currentStatus,
  onStatusChange,
  disabled = false,
}: PartnershipRequestStatusSelectorProps) {
  const handleValueChange = (value: string) => {
    onStatusChange(requestId, value as PartnershipStatus);
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={`w-[140px] ${statusColors[currentStatus]}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PENDING">
          <span className={statusColors.PENDING}>{statusLabels.PENDING}</span>
        </SelectItem>
        <SelectItem value="CONTACTED">
          <span className={statusColors.CONTACTED}>
            {statusLabels.CONTACTED}
          </span>
        </SelectItem>
        <SelectItem value="ACCEPTED">
          <span className={statusColors.ACCEPTED}>{statusLabels.ACCEPTED}</span>
        </SelectItem>
        <SelectItem value="REJECTED">
          <span className={statusColors.REJECTED}>{statusLabels.REJECTED}</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
