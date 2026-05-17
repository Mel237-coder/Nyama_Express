'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, X, Check, ChefHat } from 'lucide-react';
import type { Order, OrderItem } from '@djossfood/database';

type OrderWithItems = Order & { order_items: OrderItem[] };

interface OrderCardProps {
  order: OrderWithItems;
  onConfirm?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onClick?: (order: OrderWithItems) => void;
  isPending?: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${Math.floor(diffHours / 24)}j`;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function getTimeRemaining(order: Order): number | null {
  if (order.status !== 'pending' || !order.expires_at) return null;
  const remaining = new Date(order.expires_at).getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

export function OrderCard({
  order,
  onConfirm,
  onReject,
  onMarkReady,
  onClick,
  isPending,
}: OrderCardProps) {
  const itemsCount = order.order_items?.length ?? 0;
  const timeRemaining = getTimeRemaining(order);
  const isUrgent = timeRemaining !== null && timeRemaining < 60;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        isUrgent && 'border-destructive/50',
      )}
      onClick={() => onClick?.(order)}
    >
      <CardContent className="p-3">
        {/* Header: order number + timer */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">
            #{order.order_number}
          </span>
          {timeRemaining !== null && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                isUrgent
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700',
              )}
            >
              <Clock className="h-3 w-3" />
              {timeRemaining < 60
                ? `${timeRemaining}s`
                : `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`}
            </span>
          )}
        </div>

        {/* Items count */}
        <p className="text-xs text-muted-foreground">
          {itemsCount} article{itemsCount > 1 ? 's' : ''}
        </p>

        {/* Total */}
        <p className="mt-1 text-sm font-bold text-primary">
          {formatAmount(order.total_amount)}
        </p>

        {/* Time ago */}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatTimeAgo(order.created_at)}
        </p>

        {/* Action buttons */}
        <div className="mt-2 flex gap-2">
          {order.status === 'pending' && onConfirm && (
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(order.id);
              }}
              disabled={isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Accepter
            </Button>
          )}
          {order.status === 'pending' && onReject && (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onReject(order.id);
              }}
              disabled={isPending}
            >
              <X className="mr-1 h-3 w-3" />
              Refuser
            </Button>
          )}
          {order.status === 'confirmed' && onMarkReady && (
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onMarkReady(order.id);
              }}
              disabled={isPending}
            >
              <ChefHat className="mr-1 h-3 w-3" />
              Marquer prete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}