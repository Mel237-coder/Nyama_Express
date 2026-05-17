'use client';

import { useState } from 'react';
import { useRestaurantContext } from '@/contexts/restaurant-context';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { RestaurantStatus } from '@djossfood/database';

export function SettingsForm() {
  const { restaurant } = useRestaurantContext();
  const queryClient = useQueryClient();

  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description ?? '');
  const [phone, setPhone] = useState(restaurant.phone ?? '');
  const [address, setAddress] = useState(restaurant.address ?? '');
  const [deliveryFee, setDeliveryFee] = useState(restaurant.delivery_fee.toString());
  const [minOrderAmount, setMinOrderAmount] = useState(restaurant.min_order_amount.toString());
  const [status, setStatus] = useState<RestaurantStatus>(restaurant.status);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/api/restaurant-owner/restaurant', {
        name: name.trim(),
        description: description.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        delivery_fee: parseFloat(deliveryFee) || 0,
        min_order_amount: parseFloat(minOrderAmount) || 0,
        status,
      });

      toast.success('Parametres enregistres');
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du restaurant</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du restaurant"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Decrivez votre restaurant"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telephone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse du restaurant"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="delivery-fee">Frais de livraison (FCFA)</Label>
            <Input
              id="delivery-fee"
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-order">Commande minimum (FCFA)</Label>
            <Input
              id="min-order"
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
          <Switch
            id="status"
            checked={status === 'open'}
            onCheckedChange={(checked) => setStatus(checked ? 'open' : 'closed')}
          />
          <div>
            <Label htmlFor="status" className="text-base font-medium">
              Restaurant {status === 'open' ? 'ouvert' : 'ferme'}
            </Label>
            <p className="text-sm text-muted-foreground">
              Les clients peuvent passer commande uniquement lorsque vous etes ouvert.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-primary hover:bg-primary/90"
      >
        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </Button>
    </div>
  );
}