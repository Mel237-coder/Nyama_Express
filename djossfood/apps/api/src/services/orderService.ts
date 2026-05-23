import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase';
import {
  PLATFORM_COMMISSION_RATE,
  UPFRONT_PERCENTAGE,
  DELIVERY_PAYMENT_PERCENTAGE,
  ORDER_TIMEOUT_MS,
  DELIVERY_CONFIRM_TIMEOUT_MS,
} from '../config/constants';
import { PaymentService } from './paymentService';
import { NotificationService } from './notificationService';
import type { OrderCreationData, Order, OrderItem, Restaurant, MenuItem, Driver } from '@djossfood/database';

// ---------------------------------------------------------------------------
// TimeoutService (Bull queue integration – Task 12 will provide the real impl)
// ---------------------------------------------------------------------------

export interface TimeoutService {
  scheduleOrderTimeout(orderId: string): Promise<string>;
  cancelOrderTimeout(jobId: string): Promise<void>;
  scheduleDeliveryConfirmTimeout(orderId: string): Promise<string>;
}

// ---------------------------------------------------------------------------
// DriverMatchingService (PostGIS proximity search – Task 11 will provide impl)
// ---------------------------------------------------------------------------

export interface DriverMatchingService {
  findDriver(orderId: string, restaurantId: string, radiusKm?: number): Promise<Driver | null>;
}

// ---------------------------------------------------------------------------
// RoutingService (Google Maps / routing – Task 11 will provide impl)
// ---------------------------------------------------------------------------

export interface RouteResult {
  distance_km: number;
  duration_min: number;
  polyline: string;
}

export interface RoutingService {
  calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteResult | null>;
}

// ---------------------------------------------------------------------------
// Socket.IO emitter interface
// ---------------------------------------------------------------------------

export interface SocketEmitter {
  to(room: string): { emit: (event: string, ...args: any[]) => void };
}

// ---------------------------------------------------------------------------
// Wallet credit helper (used in clientConfirmDelivery)
// ---------------------------------------------------------------------------

interface WalletCredit {
  userId: string;
  role: 'restaurant' | 'driver';
  amount: number;
}

// ---------------------------------------------------------------------------
// OrderService
// ---------------------------------------------------------------------------

export class OrderService {
  private supabaseOverride: SupabaseClient | null = null;

  constructor(
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private timeoutService: TimeoutService,
    private driverMatchingService: DriverMatchingService,
    private routingService: RoutingService,
    private io: SocketEmitter | null = null,
  ) {}

  /** Inject a mock Supabase client for testing */
  setSupabaseMock(client: SupabaseClient): void {
    this.supabaseOverride = client;
  }

  /** Inject or replace the Socket.IO emitter */
  setSocketEmitter(io: SocketEmitter): void {
    this.io = io;
  }

  private get supabase(): SupabaseClient {
    return this.supabaseOverride || getSupabaseAdmin();
  }

  // =======================================================================
  // 1. createOrder
  // =======================================================================

  async createOrder(data: OrderCreationData): Promise<Order> {
    // ---- Fetch menu items to calculate subtotal ----
    const menuItemIds = data.items.map((i) => i.menu_item_id);
    const { data: menuItems, error: menuError } = await this.supabase
      .from('menu_items')
      .select('*')
      .in('id', menuItemIds);

    if (menuError || !menuItems || menuItems.length !== menuItemIds.length) {
      throw new Error('Impossible de recuperer les articles du menu');
    }

    // ---- Calculate subtotal ----
    const itemsMap = new Map<string, MenuItem>();
    for (const mi of menuItems) {
      itemsMap.set(mi.id, mi as MenuItem);
    }

    let subtotal = 0;
    const orderItemsData: Array<{
      menu_item_id: string;
      name: string;
      price: number;
      quantity: number;
      subtotal: number;
      special_instructions: string | null;
    }> = [];

    for (const item of data.items) {
      const menuItem = itemsMap.get(item.menu_item_id)!;
      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;
      orderItemsData.push({
        menu_item_id: item.menu_item_id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        special_instructions: item.special_instructions || null,
      });
    }

    // ---- Get restaurant's delivery_fee ----
    const { data: restaurant, error: restError } = await this.supabase
      .from('restaurants')
      .select('id, owner_id, name, delivery_fee, location')
      .eq('id', data.restaurant_id)
      .single();

    if (restError || !restaurant) {
      throw new Error('Restaurant non trouve');
    }

    const deliveryFee: number = restaurant.delivery_fee ?? 0;
    const totalAmount = subtotal + deliveryFee;
    const amountPaidUpfront = Math.round(totalAmount * UPFRONT_PERCENTAGE);

    // ---- Initiate upfront payment (60%) ----
    const paymentResult = await this.paymentService.initiatePayment({
      phoneNumber: data.payment_phone,
      amount: amountPaidUpfront,
      description: `Commande DjossFood - acompte 60%`,
      externalReference: `order-upfront-${Date.now()}`,
      provider: data.payment_method === 'mtn_mobile_money' ? 'mtn_momo' : 'orange_money',
    });

    if (!paymentResult.success) {
      throw new Error('Paiement echoue');
    }

    // ---- Insert order ----
    const expiresAt = new Date(Date.now() + ORDER_TIMEOUT_MS).toISOString();

    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        client_id: data.client_id,
        restaurant_id: data.restaurant_id,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        amount_paid_upfront: amountPaidUpfront,
        amount_paid_delivery: 0,
        payment_method: data.payment_method === 'mtn_mobile_money' ? 'mobile_money' : 'mobile_money',
        payment_status: 'partial',
        payment_phone: data.payment_phone,
        payment_ref_upfront: paymentResult.reference || null,
        delivery_address: data.delivery_address,
        delivery_location: data.delivery_lat && data.delivery_lng
          ? {
              type: 'Point',
              coordinates: [data.delivery_lng, data.delivery_lat],
            }
          : null,
        delivery_notes: data.delivery_notes || null,
        expires_at: expiresAt,
        client_confirmed_delivery: false,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error('Erreur lors de la creation de la commande');
    }

    const orderId: string = order.id;

    // ---- Insert order items ----
    const orderItemsWithOrderId = orderItemsData.map((oi) => ({
      order_id: orderId,
      ...oi,
    }));

    await this.supabase.from('order_items').insert(orderItemsWithOrderId);

    // ---- Notify restaurant owner ----
    const template = this.notificationService.templates.new_order(
      String(order.order_number),
    );
    await this.notificationService.sendPushNotification({
      userId: restaurant.owner_id,
      title: template.title,
      body: template.body,
      data: { orderId, type: 'new_order' },
    });

    // ---- Schedule timeout job ----
    const timeoutJobId = await this.timeoutService.scheduleOrderTimeout(orderId);

    // Store timeout job id on the order for later cancellation
    await this.supabase
      .from('orders')
      .update({ notes: `timeout_job:${timeoutJobId}` } as any)
      .eq('id', orderId);

    // ---- Emit Socket.IO event ----
    this.io?.to(`restaurant_${data.restaurant_id}`).emit('new_order', { orderId, orderNumber: order.order_number });

    return order as Order;
  }

  // =======================================================================
  // 2. handleOrderTimeout
  // =======================================================================

  async handleOrderTimeout(orderId: string): Promise<void> {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error(`Order ${orderId} not found for timeout handling`);
      return;
    }

    // If the order is no longer pending, the restaurant already accepted – do nothing
    if ((order as any).status !== 'pending') {
      return;
    }

    // Update status to rejected
    await this.supabase
      .from('orders')
      .update({
        status: 'rejected',
        cancellation_reason: 'Timeout: restaurant did not accept within 5 minutes',
      })
      .eq('id', orderId);

    // Refund the upfront payment
    if ((order as any).payment_ref_upfront) {
      await this.paymentService.refundPayment((order as any).payment_ref_upfront);
    }

    // Notify client
    const template = this.notificationService.templates.order_rejected_timeout();
    await this.notificationService.sendPushNotification({
      userId: (order as any).client_id,
      title: template.title,
      body: template.body,
      data: { orderId, type: 'order_rejected', reason: 'timeout' },
    });

    // Emit Socket.IO event
    this.io?.to(`client_${(order as any).client_id}`).emit('order_rejected', {
      orderId,
      reason: 'timeout',
    });
  }

  private async verifyRestaurantOwnership(orderId: string, userId: string): Promise<void> {
    const { data: order } = await this.supabase.from('orders').select('restaurant_id').eq('id', orderId).single();
    if (!order) throw new Error('Commande non trouvee');
    const { data: restaurant } = await this.supabase.from('restaurants').select('owner_id').eq('id', (order as any).restaurant_id).single();
    if (!restaurant || (restaurant as any).owner_id !== userId) {
      throw new Error('Permission refusee');
    }
  }

  // =======================================================================
  // 3. restaurantConfirmOrder
  // =======================================================================

  async restaurantConfirmOrder(orderId: string, restaurantOwnerId: string): Promise<void> {
    await this.verifyRestaurantOwnership(orderId, restaurantOwnerId);

    // Fetch the order
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande non trouvee');
    }

    // Fetch the restaurant for notifications
    const { data: restaurant, error: restError } = await this.supabase
      .from('restaurants')
      .select('id, owner_id, name')
      .eq('id', (order as any).restaurant_id)
      .single();

    if (restError || !restaurant) {
      throw new Error('Restaurant non trouve');
    }

    if ((order as any).status !== 'pending') {
      throw new Error('La commande n\'est plus en attente');
    }

    // Cancel the Bull timeout job
    const notes: string = (order as any).notes || '';
    const timeoutJobMatch = notes.match(/timeout_job:([^,\s]+)/);
    if (timeoutJobMatch) {
      await this.timeoutService.cancelOrderTimeout(timeoutJobMatch[1]);
    }

    // Update status: confirmed -> preparing
    const now = new Date().toISOString();
    await this.supabase
      .from('orders')
      .update({
        status: 'confirmed',
        confirmed_at: now,
      })
      .eq('id', orderId);

    await this.supabase
      .from('orders')
      .update({
        status: 'preparing',
        preparing_started_at: now,
      })
      .eq('id', orderId);

    // Notify client
    const template = this.notificationService.templates.order_confirmed((restaurant as any).name);
    await this.notificationService.sendPushNotification({
      userId: (order as any).client_id,
      title: template.title,
      body: template.body,
      data: { orderId, type: 'order_confirmed' },
    });

    // Emit Socket.IO event
    this.io?.to(`order_${orderId}`).emit('order_status_changed', {
      orderId,
      status: 'preparing',
    });
  }

  // =======================================================================
  // 4. restaurantRejectOrder
  // =======================================================================

  async restaurantRejectOrder(orderId: string, reason: string, restaurantOwnerId: string): Promise<void> {
    await this.verifyRestaurantOwnership(orderId, restaurantOwnerId);

    // Update status to rejected
    await this.supabase
      .from('orders')
      .update({
        status: 'rejected',
        cancellation_reason: reason,
      })
      .eq('id', orderId);

    // Fetch order for client_id and payment ref
    const { data: order } = await this.supabase
      .from('orders')
      .select('client_id, payment_ref_upfront')
      .eq('id', orderId)
      .single();

    if (order) {
      // Refund upfront payment
      if ((order as any).payment_ref_upfront) {
        await this.paymentService.refundPayment((order as any).payment_ref_upfront);
      }

      // Notify client
      const template = this.notificationService.templates.order_rejected_manual(reason);
      await this.notificationService.sendPushNotification({
        userId: (order as any).client_id,
        title: template.title,
        body: template.body,
        data: { orderId, type: 'order_rejected', reason },
      });

      // Emit Socket.IO event
      this.io?.to(`client_${(order as any).client_id}`).emit('order_rejected', {
        orderId,
        reason,
      });
    }
  }

  // =======================================================================
  // 5. restaurantMarkReady
  // =======================================================================

  async restaurantMarkReady(orderId: string, restaurantOwnerId: string): Promise<void> {
    await this.verifyRestaurantOwnership(orderId, restaurantOwnerId);

    await this.supabase
      .from('orders')
      .update({
        status: 'ready',
        ready_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Fetch order for driver search data
    const { data: order } = await this.supabase
      .from('orders')
      .select('id, restaurant_id, client_id')
      .eq('id', orderId)
      .single();

    if (order) {
      // Fetch restaurant location for driver search
      const { data: restaurant } = await this.supabase
        .from('restaurants')
        .select('id, location, name')
        .eq('id', (order as any).restaurant_id)
        .single();

      if (restaurant) {
        // Start driver search (async – does not block)
        this.driverMatchingService
          .findDriver(orderId, (order as any).restaurant_id)
          .catch((err) => console.error('Driver search failed:', err.message));
      }

      // Notify client
      await this.notificationService.sendPushNotification({
        userId: (order as any).client_id,
        title: 'Repas pret !',
        body: 'Votre repas est pret ! Nous recherchons un livreur...',
        data: { orderId, type: 'order_ready' },
      });

      // Emit Socket.IO event
      this.io?.to(`order_${orderId}`).emit('order_status_changed', {
        orderId,
        status: 'ready',
      });
    }
  }

  // =======================================================================
  // 6. driverAcceptDelivery
  // =======================================================================

  async driverAcceptDelivery(orderId: string, driverId: string): Promise<void> {
    // Verify driver is available
    const { data: driver, error: driverError } = await this.supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      throw new Error('Livreur non trouve');
    }

    if ((driver as any).status !== 'available') {
      throw new Error('Le livreur n\'est pas disponible');
    }

    // Update order: driver_assigned
    await this.supabase
      .from('orders')
      .update({
        status: 'driver_assigned',
        driver_id: driverId,
        driver_assigned_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Update driver status to busy
    await this.supabase
      .from('drivers')
      .update({ status: 'busy' })
      .eq('id', driverId);

    // Fetch order for route calculation
    const { data: order } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (order) {
      // Fetch restaurant location for route
      const { data: restaurant } = await this.supabase
        .from('restaurants')
        .select('location, name')
        .eq('id', (order as any).restaurant_id)
        .single();

      if (restaurant) {
        const origin = this.extractLocation((restaurant as any).location);
        const destination = this.extractLocation((order as any).delivery_location);

        try {
          const route = await this.routingService.calculateRoute(
            origin.lat, origin.lng, destination.lat, destination.lng,
          );

          if (route) {
            // Save route data to order
            await this.supabase
              .from('orders')
              .update({
                route_distance_km: route.distance_km,
                route_duration_min: route.duration_min,
                route_polyline: route.polyline,
                estimated_delivery_time: new Date(
                  Date.now() + route.duration_min * 60 * 1000,
                ).toISOString(),
              })
              .eq('id', orderId);

            // Notify client
            const template = this.notificationService.templates.driver_found(
              (driver as any).id,
              route.duration_min,
            );
            await this.notificationService.sendPushNotification({
              userId: (order as any).client_id,
              title: template.title,
              body: template.body,
              data: { orderId, type: 'driver_assigned', driverId, eta: route.duration_min },
            });

            // Emit Socket.IO event with driver info + ETA
            this.io?.to(`order_${orderId}`).emit('driver_assigned', {
              orderId,
              driverId,
              driverName: (driver as any).id,
              eta: route.duration_min,
              routePolyline: route.polyline,
            });
          } else {
            // Route calculation returned null — fall through to fallback notification
            throw new Error('Route calculation returned null');
          }
        } catch (routeError: any) {
          console.error('Route calculation failed:', routeError.message);
          // Still notify client even if route fails
          const template = this.notificationService.templates.driver_found(
            (driver as any).id,
            0, // unknown ETA
          );
          await this.notificationService.sendPushNotification({
            userId: (order as any).client_id,
            title: template.title,
            body: template.body,
            data: { orderId, type: 'driver_assigned', driverId },
          });

          this.io?.to(`order_${orderId}`).emit('driver_assigned', {
            orderId,
            driverId,
            driverName: (driver as any).id,
            eta: 0,
          });
        }
      }
    }
  }

  // =======================================================================
  // 7. driverPickedUp
  // =======================================================================

  async driverPickedUp(orderId: string, driverId: string): Promise<void> {
    const now = new Date().toISOString();

    // Update status: picked_up -> delivering
    await this.supabase
      .from('orders')
      .update({
        status: 'picked_up',
        picked_up_at: now,
      })
      .eq('id', orderId);

    await this.supabase
      .from('orders')
      .update({
        status: 'delivering',
      })
      .eq('id', orderId);

    // Fetch order for client_id
    const { data: order } = await this.supabase
      .from('orders')
      .select('client_id')
      .eq('id', orderId)
      .single();

    if (order) {
      const template = this.notificationService.templates.order_delivering();
      await this.notificationService.sendPushNotification({
        userId: (order as any).client_id,
        title: template.title,
        body: template.body,
        data: { orderId, type: 'order_delivering' },
      });

      // Emit Socket.IO event
      this.io?.to(`order_${orderId}`).emit('order_status_changed', {
        orderId,
        status: 'delivering',
      });
    }
  }

  // =======================================================================
  // 8. driverMarkDelivered
  // =======================================================================

  async driverMarkDelivered(orderId: string, driverId: string): Promise<void> {
    await this.supabase
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Fetch order for client_id
    const { data: order } = await this.supabase
      .from('orders')
      .select('client_id')
      .eq('id', orderId)
      .single();

    if (order) {
      // Notify client
      const template = this.notificationService.templates.order_delivered();
      await this.notificationService.sendPushNotification({
        userId: (order as any).client_id,
        title: template.title,
        body: template.body,
        data: { orderId, type: 'order_delivered' },
      });

      // Schedule auto-confirm timeout (15 min)
      await this.timeoutService.scheduleDeliveryConfirmTimeout(orderId);

      // Emit Socket.IO event
      this.io?.to(`order_${orderId}`).emit('order_status_changed', {
        orderId,
        status: 'delivered',
      });
    }
  }

  // =======================================================================
  // 9. clientConfirmDelivery
  // =======================================================================

  async clientConfirmDelivery(orderId: string, clientId: string): Promise<void> {
    // Fetch order
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      throw new Error('Commande non trouvee');
    }

    if ((order as any).client_id !== clientId) {
      throw new Error('Vous n\'etes pas le client de cette commande');
    }

    // Calculate the 40% remaining amount
    const totalAmount: number = (order as any).total_amount;
    const amountPaidUpfront: number = (order as any).amount_paid_upfront;
    const remainingAmount = totalAmount - amountPaidUpfront;

    // Initiate delivery payment (40%)
    const paymentResult = await this.paymentService.initiatePayment({
      phoneNumber: (order as any).payment_phone,
      amount: remainingAmount,
      description: `Commande DjossFood - solde 40%`,
      externalReference: `order-delivery-${orderId}`,
      provider: (order as any).payment_method === 'mtn_mobile_money' ? 'mtn_momo' : 'orange_money',
    });

    if (paymentResult.success) {
      // Update order to completed
      await this.supabase
        .from('orders')
        .update({
          status: 'completed',
          amount_paid_delivery: remainingAmount,
          payment_ref_delivery: paymentResult.reference || null,
          payment_status: 'completed',
          client_confirmed_delivery: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Calculate commissions
      const subtotal: number = (order as any).subtotal;
      const deliveryFee: number = (order as any).delivery_fee;
      const platformCommission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);

      // Proportional commission split:
      // Restaurant commission = subtotal * commission_rate
      // Driver commission = delivery_fee * commission_rate
      const restaurantCommission = Math.round(subtotal * PLATFORM_COMMISSION_RATE);
      const driverCommission = Math.round(deliveryFee * PLATFORM_COMMISSION_RATE);

      // Credit restaurant wallet: subtotal - restaurant commission
      await this.creditWallet((order as any).restaurant_id, 'restaurant', subtotal - restaurantCommission);

      // Credit driver wallet: delivery_fee - driver commission
      if ((order as any).driver_id) {
        await this.creditWallet((order as any).driver_id, 'driver', deliveryFee - driverCommission);
      }

      // Update driver status back to available
      if ((order as any).driver_id) {
        await this.supabase
          .from('drivers')
          .update({ status: 'available' })
          .eq('id', (order as any).driver_id);

        await this.creditDriverStats((order as any).driver_id);
      }

      // Send rating notification
      const { data: restaurant } = await this.supabase
        .from('restaurants')
        .select('name')
        .eq('id', (order as any).restaurant_id)
        .single();

      const restaurantName = restaurant ? (restaurant as any).name : 'votre restaurant';
      const template = this.notificationService.templates.rate_order(restaurantName);
      await this.notificationService.sendPushNotification({
        userId: clientId,
        title: template.title,
        body: template.body,
        data: { orderId, type: 'rate_order' },
      });
    }

    // Emit Socket.IO event regardless of payment result
    this.io?.to(`order_${orderId}`).emit('order_status_changed', {
      orderId,
      status: paymentResult.success ? 'completed' : 'delivered',
    });

    if (!paymentResult.success) {
      throw new Error('Le paiement du solde a echoue. Veuillez reessayer.');
    }
  }

  // =======================================================================
  // Helpers
  // =======================================================================

  private async creditWallet(userId: string, role: 'restaurant' | 'driver', amount: number): Promise<void> {
    if (role === 'driver') {
      await this.supabase.rpc('increment_wallet_balance', { p_user_id: userId, p_amount: amount });
    } else {
      await this.supabase.rpc('increment_restaurant_wallet_balance', { p_restaurant_id: userId, p_amount: amount });
    }
  }

  private async creditDriverStats(driverId: string): Promise<void> {
    await this.supabase.rpc('increment_driver_deliveries', { p_driver_id: driverId });
  }

  private extractLocation(location: any): { lat: number; lng: number } {
    if (!location) {
      return { lat: 0, lng: 0 }; // fallback
    }
    // PostGIS GeoJSON: { type: 'Point', coordinates: [lng, lat] }
    if (location.type === 'Point' && Array.isArray(location.coordinates)) {
      return {
        lng: location.coordinates[0],
        lat: location.coordinates[1],
      };
    }
    // Direct lat/lng
    if (location.lat !== undefined && location.lng !== undefined) {
      return { lat: location.lat, lng: location.lng };
    }
    return { lat: 0, lng: 0 };
  }
}

// Export a factory function – real instantiation with dependencies is done in the
// Express entry point (Task 15). Tests instantiate OrderService directly with mocks.