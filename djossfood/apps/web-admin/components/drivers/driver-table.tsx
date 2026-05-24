'use client';

import { useState } from 'react';
import type { DriverWithProfile } from '@/hooks/use-drivers';
import { useApproveDriver, useDriverDetail } from '@/hooks/use-drivers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: 'Moto',
  bicycle: 'Velo',
  car: 'Voiture',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  available: { label: 'En ligne', className: 'bg-green-100 text-green-800' },
  offline: { label: 'Hors ligne', className: 'bg-gray-100 text-gray-800' },
  busy: { label: 'En course', className: 'bg-yellow-100 text-yellow-800' },
  on_delivery: { label: 'En livraison', className: 'bg-orange-100 text-orange-800' },
};

interface DriverTableProps {
  drivers: DriverWithProfile[];
}

export function DriverTable({ drivers }: DriverTableProps) {
  const approveMutation = useApproveDriver();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const { data: detailData } = useDriverDetail(selectedDriverId);
  const detail = detailData?.driver;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Telephone</th>
              <th className="px-4 py-3 font-medium">Vehicule</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Approuve</th>
              <th className="px-4 py-3 font-medium">Courses</th>
              <th className="px-4 py-3 font-medium">Cree le</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const profile = d.profiles;
              const statusInfo = STATUS_LABELS[d.status] || { label: d.status, className: 'bg-gray-100 text-gray-800' };
              return (
                <tr
                  key={d.id}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedDriverId(d.id)}
                >
                  <td className="px-4 py-3 font-medium">
                    {profile?.full_name || 'Sans nom'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{profile?.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {VEHICLE_LABELS[d.vehicle_type || ''] || d.vehicle_type || '-'}
                    {d.vehicle_plate ? ` (${d.vehicle_plate})` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        approveMutation.mutate(d.id);
                      }}
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${
                        d.is_approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      disabled={approveMutation.isPending}
                    >
                      {d.is_approved ? 'Oui' : 'Non'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.total_deliveries}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Driver Detail Dialog */}
      <Dialog open={!!selectedDriverId} onOpenChange={(open) => !open && setSelectedDriverId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Details du livreur</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom</p>
                  <p className="font-medium">{(detail as Record<string, unknown>).profiles != null ? ((detail as Record<string, Record<string, string>>).profiles?.full_name || 'Sans nom') : 'Sans nom'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telephone</p>
                  <p className="font-medium">{(detail as Record<string, unknown>).profiles != null ? ((detail as Record<string, Record<string, string>>).profiles?.phone || '-') : '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vehicule</p>
                  <p className="font-medium">
                    {VEHICLE_LABELS[detail.vehicle_type || ''] || detail.vehicle_type || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plaque</p>
                  <p className="font-medium">{detail.vehicle_plate || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Note</p>
                  <p className="font-medium">
                    {detail.rating_count > 0 ? `${detail.rating.toFixed(1)}/5` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Solde</p>
                  <p className="font-medium">{detail.wallet_balance.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">Documents</p>
                {detail.documents && Object.keys(detail.documents).length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {Object.entries(detail.documents).map(([key, url]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        {typeof url === 'string' && (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                            Voir
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun document</p>
                )}
              </div>
              {!detail.is_approved && (
                <Button
                  onClick={() => {
                    approveMutation.mutate(detail.id);
                    setSelectedDriverId(null);
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? 'Approbation...' : 'Approuver ce livreur'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}