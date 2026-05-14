import React from 'react';
import { useRouter } from 'next/router';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '../components/layout/GlassCard';
import { NeonButton } from '../components/layout/NeonButton';

export default function OrderSuccess() {
  const router = useRouter();
  const { orderId } = router.query;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Celebration checkmark */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20">
            <CheckCircle className="w-16 h-16 text-[#00FF88] status-success pulse-neon" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Commande confirmée !</h1>
        <p className="text-white/60 mb-8">
          Votre délicieux repas est en préparation. Préparez-vous à savourer !
        </p>

        <GlassCard className="p-6 mb-8 text-left">
          <p className="text-sm text-white/40 uppercase tracking-wider font-semibold mb-1">
            Numéro de commande
          </p>
          <p className="text-lg font-mono font-bold text-white">
            {orderId || 'N/A'}
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Statut</span>
              <span className="status-success font-medium">Confirmée</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Temps estimé</span>
              <span className="text-white font-medium">25-35 min</span>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <NeonButton
            size="lg"
            className="w-full"
            onClick={() => router.push(`/orders/${orderId}`)}
          >
            Suivre ma commande
          </NeonButton>

          <NeonButton
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Retour à l&apos;accueil
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
