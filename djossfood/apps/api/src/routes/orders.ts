import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { requireOrderOwnerOrAdmin } from '../middleware/ownership';
import { OrderService } from '../services/orderService';
import { PaymentService } from '../services/paymentService';
import { NotificationService } from '../services/notificationService';
import { TimeoutService } from '../services/timeoutService';
import { DriverMatchingService } from '../services/driverMatchingService';
import { RoutingService } from '../services/routingService';
import { getSupabaseAdmin } from '../config/supabase';
import type { OrderCreationData } from '@djossfood/database';

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

// Helper to create a new OrderService instance per request
function createOrderService(): OrderService {
  return new OrderService(
    new PaymentService(),
    new NotificationService(),
    new TimeoutService(),
    new DriverMatchingService(),
    new RoutingService(),
  );
}

// POST /api/orders - Create a new order
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const orderService = createOrderService();
    const orderData: OrderCreationData = {
      ...req.body,
      client_id: req.userId!,
    };

    const order = await orderService.createOrder(orderData);
    return res.status(201).json({ order });
  } catch (err: any) {
    console.error('Create order error:', err.message);
    return res.status(400).json({ error: err.message || 'Erreur lors de la creation de la commande' });
  }
});

// GET /api/orders/:id - Get order detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseAdmin();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Commande non trouvee' });
    }

    // Verify the caller has permission to view this order
    const userId = req.userId!;
    const userRole = req.userRole!;
    const isClient = (order as any).client_id === userId;
    const isRestaurantOwner = false; // Would need to join with restaurants
    const isDriver = (order as any).driver_id === userId;
    const isAdmin = userRole === 'admin';

    // Check restaurant ownership
    if (!isClient && !isDriver && !isAdmin) {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', (order as any).restaurant_id)
        .single();

      if (!restaurant || (restaurant as any).owner_id !== userId) {
        return res.status(403).json({ error: 'Acces refuse' });
      }
    }

    return res.json({ order });
  } catch (err: any) {
    console.error('Get order error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/orders/:id/confirm - Restaurant confirms order
router.post('/:id/confirm', requireOrderOwnerOrAdmin, async (req: AuthRequest, res: Response) => {
  const ownership = (req as any).orderOwnership;
  if (!ownership?.isRestaurantOwner && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission refusee: seul le proprietaire du restaurant peut confirmer' });
  }
  const { id } = req.params;

  try {
    const orderService = createOrderService();
    await orderService.restaurantConfirmOrder(id, req.userId!);
    return res.json({ message: 'Commande confirmee' });
  } catch (err: any) {
    console.error('Confirm order error:', err.message);
    return res.status(400).json({ error: err.message || 'Erreur lors de la confirmation' });
  }
});

// POST /api/orders/:id/reject - Restaurant rejects order
router.post('/:id/reject', requireOrderOwnerOrAdmin, async (req: AuthRequest, res: Response) => {
  const ownership = (req as any).orderOwnership;
  if (!ownership?.isRestaurantOwner && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission refusee: seul le proprietaire du restaurant peut rejeter' });
  }
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'La raison du rejet est requise' });
  }

  try {
    const orderService = createOrderService();
    await orderService.restaurantRejectOrder(id, reason, req.userId!);
    return res.json({ message: 'Commande refusee' });
  } catch (err: any) {
    console.error('Reject order error:', err.message);
    return res.status(400).json({ error: err.message || 'Erreur lors du rejet' });
  }
});

// POST /api/orders/:id/ready - Restaurant marks order ready
router.post('/:id/ready', requireOrderOwnerOrAdmin, async (req: AuthRequest, res: Response) => {
  const ownership = (req as any).orderOwnership;
  if (!ownership?.isRestaurantOwner && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission refusee: seul le proprietaire du restaurant peut marquer pret' });
  }
  const { id } = req.params;

  try {
    const orderService = createOrderService();
    await orderService.restaurantMarkReady(id, req.userId!);
    return res.json({ message: 'Commande prete' });
  } catch (err: any) {
    console.error('Mark ready error:', err.message);
    return res.status(400).json({ error: err.message || 'Erreur lors du passage en pret' });
  }
});

// POST /api/orders/:id/accept - Driver accepts delivery
router.post('/:id/accept', requireOrderOwnerOrAdmin, async (req: AuthRequest, res: Response) => {
  const ownership = (req as any).orderOwnership;
  if (!ownership?.isDriver && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission refusee: seul un livreur peut accepter' });
  }
  const { id } = req.params;

  try {
    const orderService = createOrderService();
    await orderService.driverAcceptDelivery(id, req.userId!);
    return res.json({ message: 'Livraison acceptee' });
  } catch (err: any) {
    console.error('Accept delivery error:', err.message);
    return res.status(400).json({ error: err.message || 'Erreur lors de l\'acceptation' });
  }
});

// POST /api/orders/:id/pickup - Driver picks up order
router.post('/:id/pickup', requireOrderOwnerOrAdmin, async (req: AuthRequest, res: Response) => {
  const ownership = (req as any).orderOwnership;
  if (!ownership?.isDriver && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission refusee: seul le livreur assigne peut recuperer' });
  }
  const { id } = req.params;

  try {
    const orderService = createOrderService();
    await orderService.driverPickedUp(id, req.userId!);
    return res.json({ message: 'Commande recuperee' });
  } catch (err: any) {
    console.error('Pickup error:', err.message);
    return res.status(400).json({ error: err.message || 'Erreur lors de la recuperation' });
  }
});

// POST /api/orders/:id/deliver - Driver marks delivered
router.post('/:id/deliver', requireOrderOwnerOrAdmin, async (req: AuthRequest, res: Response) => {
  const ownership = (req as any).orderOwnership;
  if (!ownership?.isDriver && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission refusee: seul le livreur assigne peut livrer' });
  }
  const { id } = req.params;

  try {
    const orderService = createOrderService();
    await orderService.driverMarkDelivered(id, req.userId!);
    return res.json({ message: 'Commande livree' });
  } catch (err: any) {
    console.error('Deliver error:', err.message);
    return res.status(400).json({ error: err.message || 'Erreur lors de la livraison' });
  }
});

// POST /api/orders/:id/confirm-delivery - Client confirms delivery
router.post('/:id/confirm-delivery', requireOrderOwnerOrAdmin, async (req: AuthRequest, res: Response) => {
  const ownership = (req as any).orderOwnership;
  if (!ownership?.isClient && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission refusee: seul le client peut confirmer la livraison' });
  }
  const { id } = req.params;

  try {
    const orderService = createOrderService();
    await orderService.clientConfirmDelivery(id, req.userId!);
    return res.json({ message: 'Livraison confirmee' });
  } catch (err: any) {
    console.error('Confirm delivery error:', err.message);
    return res.status(400).json({ error: err.message || 'Erreur lors de la confirmation de livraison' });
  }
});

export const ordersRouter = router;