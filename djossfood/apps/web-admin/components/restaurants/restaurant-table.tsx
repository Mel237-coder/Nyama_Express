'use client';

import { useState } from 'react';
import type { Restaurant } from '@djossfood/database';
import { useApproveRestaurant, useBoostRestaurant } from '@/hooks/use-restaurants';
import { BoostDialog } from './boost-dialog';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface RestaurantTableProps {
  restaurants: Restaurant[];
}

export function RestaurantTable({ restaurants }: RestaurantTableProps) {
  const approveMutation = useApproveRestaurant();
  const boostMutation = useBoostRestaurant();
  const [boostTarget, setBoostTarget] = useState<Restaurant | null>(null);

  const handleBoost = (boost: number, reason: string) => {
    if (!boostTarget) return;
    boostMutation.mutate(
      { id: boostTarget.id, boost, reason },
      {
        onSuccess: () => setBoostTarget(null),
      },
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Approuve</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Boost</th>
              <th className="px-4 py-3 font-medium">Cree le</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.city || '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'busy'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {r.status === 'open' ? 'Ouvert' : r.status === 'busy' ? 'Occupe' : 'Ferme'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      approveMutation.mutate({ id: r.id, isApproved: !r.is_approved })
                    }
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${
                      r.is_approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                    disabled={approveMutation.isPending}
                  >
                    {r.is_approved ? 'Oui' : 'Non'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {r.rating_count > 0 ? `${r.total_rating.toFixed(1)}/5` : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setBoostTarget(r)}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    {r.admin_boost.toFixed(2)}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {boostTarget && (
        <BoostDialog
          open={!!boostTarget}
          onOpenChange={(open) => !open && setBoostTarget(null)}
          restaurantName={boostTarget.name}
          currentBoost={boostTarget.admin_boost}
          onBoost={handleBoost}
          loading={boostMutation.isPending}
        />
      )}
    </>
  );
}