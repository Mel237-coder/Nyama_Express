'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BoostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName: string;
  currentBoost: number;
  onBoost: (boost: number, reason: string) => void;
  loading: boolean;
}

export function BoostDialog({
  open,
  onOpenChange,
  restaurantName,
  currentBoost,
  onBoost,
  loading,
}: BoostDialogProps) {
  const [boost, setBoost] = useState(currentBoost.toString());
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBoost(parseFloat(boost), reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Boost: {restaurantName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Boost actuel: {currentBoost.toFixed(2)}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={boost}
              onChange={(e) => setBoost(e.target.value)}
              placeholder="Nouveau boost (0-5)"
            />
          </div>
          <div className="space-y-2">
            <Label>Raison (requise)</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Pourquoi ce boost?"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !reason.trim()}>
              {loading ? 'Enregistrement...' : 'Appliquer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}