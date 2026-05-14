import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api, storage } from '../../lib/api';
import { formatPrice } from '../../lib/i18n';
import { GlassCard } from '../../components/layout/GlassCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { NeonButton } from '../../components/layout/NeonButton';
import { Inbox } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  restaurant?: {
    name: string;
  };
}

const STATUS_MAP: Record<string, { labelFr: string; labelEn: string; className: string }> = {
  PENDING: { labelFr: 'En attente', labelEn: 'Pending', className: 'status-info' },
  CONFIRMED: { labelFr: 'Confirmée', labelEn: 'Confirmed', className: 'status-info' },
  PREPARING: { labelFr: 'En préparation', labelEn: 'Preparing', className: 'status-info' },
  READY: { labelFr: 'Prête', labelEn: 'Ready', className: 'status-success' },
  OUT_FOR_DELIVERY: { labelFr: 'En livraison', labelEn: 'Out for delivery', className: 'status-success' },
  DELIVERED: { labelFr: 'Livrée', labelEn: 'Delivered', className: 'status-success' },
  CANCELLED: { labelFr: 'Annulée', labelEn: 'Cancelled', className: 'status-danger' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = storage.getAccessToken();
        if (!token) {
          setError('Session expired');
          return;
        }
        const data = (await api.getOrders(token)) as any;
        setOrders(data.data || data || []);
      } catch (err: any) {
        console.error('Failed to fetch orders:', err);
        setError(err.message || 'Failed to load orders');
        // Fallback mock data for development
        setOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-12 h-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const getStatusBadge = (status: string) => {
    const mapped = STATUS_MAP[status] || {
      labelFr: status,
      labelEn: status,
      className: 'text-white/60',
    };
    return (
      <span className={`neon-badge ${mapped.className}`}>
        {language === 'fr' ? mapped.labelFr : mapped.labelEn}
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      <GlassHeader title={t('orders')} />

      <main className="px-4 py-4 space-y-4">
        {error && !loading && orders.length > 0 && (
          <div className="status-danger text-sm text-center bg-white/5 rounded-xl p-3">
            {error}
          </div>
        )}

        {loading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-4">
            <Inbox className="w-10 h-10 mx-auto text-white/40" />
            <h3 className="text-lg font-semibold text-white">
              {language === 'fr' ? 'Aucune commande' : 'No orders yet'}
            </h3>
            <p className="text-sm text-white/50">
              {language === 'fr'
                ? 'Vos commandes apparaîtront ici'
                : 'Your orders will appear here'}
            </p>
            <Link href="/">
              <NeonButton size="md">
                {language === 'fr' ? 'Parcourir les restaurants' : 'Browse restaurants'}
              </NeonButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                <GlassCard
                  elevated
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-white/40 font-mono uppercase">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <h3 className="font-semibold text-white mt-0.5">
                        {order.restaurant?.name ||
                          (language === 'fr' ? 'Restaurant' : 'Restaurant')}
                      </h3>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                    <span className="text-sm text-white/50">
                      {new Date(order.createdAt).toLocaleDateString(
                        language === 'fr' ? 'fr-FR' : 'en-US',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )}
                    </span>
                    <span className="font-bold text-white">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-elevated p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="shimmer h-3 w-20 rounded" />
              <div className="shimmer h-5 w-40 rounded" />
            </div>
            <div className="shimmer h-6 w-24 rounded-full" />
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-white/5">
            <div className="shimmer h-4 w-24 rounded" />
            <div className="shimmer h-5 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

const MOCK_ORDERS: Order[] = [
  {
    id: 'mock-order-1',
    status: 'DELIVERED',
    totalAmount: 8500,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    restaurant: { name: 'Le Petit Chef' },
  },
  {
    id: 'mock-order-2',
    status: 'OUT_FOR_DELIVERY',
    totalAmount: 12300,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    restaurant: { name: 'Pizza Palace' },
  },
  {
    id: 'mock-order-3',
    status: 'PREPARING',
    totalAmount: 5400,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    restaurant: { name: 'Chez Maman' },
  },
];
