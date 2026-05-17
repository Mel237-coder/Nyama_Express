import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase';

export interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface NotificationTemplate {
  title: string;
  body: string;
}

export class NotificationService {
  private expo: Expo;
  private supabaseOverride: SupabaseClient | null = null;

  constructor() {
    this.expo = new Expo();
  }

  /** Inject a mock Supabase client for testing */
  setSupabaseMock(client: SupabaseClient): void {
    this.supabaseOverride = client;
  }

  private get supabase(): SupabaseClient {
    return this.supabaseOverride || getSupabaseAdmin();
  }

  /**
   * Send a push notification to a user via Expo Push Notifications.
   * 1. Fetch the user's expo_push_token from the profiles table.
   * 2. Validate the token is a valid Expo push token format.
   * 3. Send the notification via Expo's push service.
   * 4. Save a record to the notifications table.
   * Returns true on success, false on failure.
   */
  async sendPushNotification(params: SendNotificationParams): Promise<boolean> {
    const { userId, title, body, data } = params;

    // 1. Fetch the user's push token
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Failed to fetch profile for push notification:', error?.message);
      return false;
    }

    const pushToken = profile.expo_push_token;

    // 2. Validate push token
    if (!pushToken) {
      return false;
    }

    if (!Expo.isExpoPushToken(pushToken)) {
      return false;
    }

    // 3. Build and send the push message
    const message: ExpoPushMessage = {
      to: pushToken,
      title,
      body,
      data: data || {},
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      const ticket = tickets[0];
      const ticketId = ticket && ticket.status === 'ok' ? (ticket as { status: 'ok'; id: string }).id : null;

      // 4. Save notification record to DB
      try {
        await this.supabase.from('notifications').insert({
          user_id: userId,
          title,
          body,
          data: data || null,
          expo_ticket_id: ticketId,
        });
      } catch (dbError: any) {
        console.error('Failed to save notification to DB:', dbError.message);
      }

      return true;
    } catch (sendError: any) {
      console.error('Expo push notification send error:', sendError.message);
      return false;
    }
  }

  /** Notification templates — all text in French */
  readonly templates = {
    new_order: (orderNumber: string): NotificationTemplate => ({
      title: '🍽️ Nouvelle commande !',
      body: `Commande ${orderNumber} — Vous avez 5 minutes pour l'accepter.`,
    }),

    order_confirmed: (restaurantName: string): NotificationTemplate => ({
      title: '✅ Commande confirmée !',
      body: `${restaurantName} a confirmé votre commande. Préparation en cours…`,
    }),

    order_rejected_timeout: (): NotificationTemplate => ({
      title: '⏰ Commande non acceptée',
      body: 'Le restaurant n\'a pas accepté la commande à temps. Vous serez remboursé.',
    }),

    order_rejected_manual: (reason: string): NotificationTemplate => ({
      title: '❌ Commande refusée',
      body: `Le restaurant a refusé votre commande. Raison : ${reason}`,
    }),

    driver_found: (driverName: string, etaMin: number): NotificationTemplate => ({
      title: '🛵 Livreur trouvé !',
      body: `${driverName} est en route — arrivée estimée dans ${etaMin} min.`,
    }),

    order_delivering: (): NotificationTemplate => ({
      title: '🚀 En route !',
      body: 'Votre commande est en cours de livraison. Suivez la progression !',
    }),

    order_delivered: (): NotificationTemplate => ({
      title: '📦 Livraison arrivée !',
      body: 'Votre commande est arrivée. Veuillez confirmer la réception.',
    }),

    delivery_request: (restaurantName: string, distanceKm: number): NotificationTemplate => ({
      title: '📍 Nouvelle course disponible',
      body: `Course de ${restaurantName} — ${distanceKm} km. Acceptez-la vite !`,
    }),

    rate_order: (restaurantName: string): NotificationTemplate => ({
      title: '⭐ Comment était votre repas ?',
      body: `Notez votre commande chez ${restaurantName} et aidez la communauté.`,
    }),
  };
}

// Export a singleton instance
export const notificationService = new NotificationService();