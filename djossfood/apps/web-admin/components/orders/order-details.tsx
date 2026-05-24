'use client';

import type { OrderWithItems } from '@/hooks/use-orders';
import { getStatusConfig } from '@/hooks/use-orders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

interface OrderDetailsProps {
  order: OrderWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetails({ order, open, onOpenChange }: OrderDetailsProps) {
  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Commande #{order.order_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.className}`}>
              {statusConfig.label}
            </span>
            <span className="text-sm text-muted-foreground">{formatDate(order.created_at)}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatAmount(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Livraison</span>
              <span>{formatAmount(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatAmount(order.total_amount)}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Articles</p>
            <div className="space-y-1">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatAmount(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Adresse:</span> {order.delivery_address || '-'}</p>
            {order.delivery_notes && (
              <p><span className="text-muted-foreground">Notes:</span> {order.delivery_notes}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}