'use client';

import type { Order } from '@djossfood/database';

interface OrderDetailsSheetProps {
  order: Order & { order_items: any[] };
  open: boolean;
  onClose: () => void;
}

export function OrderDetailsSheet({ order, open, onClose }: OrderDetailsSheetProps) {
  // Placeholder - will be implemented in Task 7
  if (!open) return null;
  return null;
}