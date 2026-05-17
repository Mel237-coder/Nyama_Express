'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@djossfood/database';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  preparing: 'En preparation',
  ready: 'Prette',
  driver_assigned: 'Livreur assigne',
  picked_up: 'Recuperee',
  delivering: 'En livraison',
  delivered: 'Livree',
  completed: 'Terminee',
  cancelled: 'Annulee',
  rejected: 'Rejetee',
};

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  preparing: 'default',
  ready: 'default',
  driver_assigned: 'default',
  picked_up: 'default',
  delivering: 'default',
  delivered: 'outline',
  completed: 'outline',
  cancelled: 'destructive',
  rejected: 'destructive',
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAYMENT_METHODS: Record<string, string> = {
  orange_money: 'Orange Money',
  mtn_mobile_money: 'MTN Mobile Money',
};

interface OrderDetailsSheetProps {
  order: Order & { order_items: any[] };
  open: boolean;
  onClose: () => void;
}

export function OrderDetailsSheet({ order, open, onClose }: OrderDetailsSheetProps) {
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusVariant = STATUS_VARIANTS[order.status] || 'secondary';

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[420px] overflow-y-auto sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Commande #{order.order_number}
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Items */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Articles</h4>
            <div className="space-y-2">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    {item.special_instructions && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">
                      {item.quantity} x {formatAmount(item.price)}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {formatAmount(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 rounded-lg bg-muted p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatAmount(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livraison</span>
              <span>{formatAmount(order.delivery_fee)}</span>
            </div>
            <div className="border-t pt-1">
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-primary">{formatAmount(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Livraison</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adresse</span>
                <span className="text-right max-w-[250px]">{order.delivery_address}</span>
              </div>
              {order.delivery_notes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="text-right max-w-[250px]">{order.delivery_notes}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paiement</span>
                <span>{PAYMENT_METHODS[order.payment_method] || order.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Chronologie</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Creee</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              {order.confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-primary">Confirmee</span>
                  <span>{formatDate(order.confirmed_at)}</span>
                </div>
              )}
              {order.ready_at && (
                <div className="flex justify-between">
                  <span className="text-blue-600">Prette</span>
                  <span>{formatDate(order.ready_at)}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-green-600">Livree</span>
                  <span>{formatDate(order.delivered_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}