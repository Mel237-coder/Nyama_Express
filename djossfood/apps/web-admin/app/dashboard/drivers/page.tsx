'use client';

import { useDrivers } from '@/hooks/use-drivers';
import { DriverTable } from '@/components/drivers/driver-table';

export default function DriversPage() {
  const { data, isLoading } = useDrivers();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.drivers.length} livreur{data.drivers.length !== 1 ? 's' : ''}
        </p>
      </div>
      <DriverTable drivers={data.drivers} />
    </div>
  );
}