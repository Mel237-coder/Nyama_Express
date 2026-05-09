// ============================================
// Gateway WebSocket - Socket.io
// Gère les connexions temps réel pour le suivi des commandes
// ============================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configurez selon vos besoins en production
  },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private websocketService: WebsocketService) {}

  /**
   * Nouvelle connexion websocket
   */
  handleConnection(client: AuthenticatedSocket) {
    // Extraire le token du query parameter ou des headers
    const token = client.handshake.auth?.token ||
                  client.handshake.query?.token as string;

    if (token) {
      const isAuth = this.websocketService.authenticateSocket(client, token);
      if (isAuth) {
        // Rejoindre sa room personnelle
        client.join(`user:${client.userId}`);
        this.logger.log(`User ${client.userId} connected via WebSocket`);

        // Si livreur, rejoindre la room des livreurs
        if (client.userRole === 'DELIVERY_PERSON') {
          client.join('role:delivery');
          this.logger.log(`Courier ${client.userId} joined delivery pool`);
        }
      } else {
        // Connexion non authentifiée - la refuser
        client.disconnect();
        this.logger.warn('Unauthenticated WebSocket connection rejected');
      }
    } else {
      // Pas de token requis pour certains endpoints publics (tracking)
      this.logger.log(`Anonymous WebSocket connection: ${client.id}`);
    }
  }

  /**
   * Déconnexion websocket
   */
  handleDisconnect(client: AuthenticatedSocket) {
    this.websocketService.handleDisconnect(client);
    this.logger.log(`WebSocket disconnected: ${client.id}`);
  }

  // ============================================
  // SUBSCRIPTIONS AUX COMMANDES
  // ============================================

  /**
   * Client s'abonne au suivi d'une commande
   */
  @SubscribeMessage('order:subscribe')
  handleOrderSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    const room = `order:${data.orderId}`;
    this.websocketService.joinRoom(client, room);
    client.emit('subscribed', { room, event: 'order:status_changed' });
    this.logger.debug(`Client ${client.id} subscribed to order ${data.orderId}`);
  }

  /**
   * Client se désabonne du suivi
   */
  @SubscribeMessage('order:unsubscribe')
  handleOrderUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    const room = `order:${data.orderId}`;
    this.websocketService.leaveRoom(client, room);
    client.emit('unsubscribed', { room });
  }

  // ============================================
  // GÉOLOCALISATION LIVREUR
  // ============================================

  /**
   * Livreur envoie sa position GPS
   */
  @SubscribeMessage('delivery:location_update')
  handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; latitude: number; longitude: number },
  ) {
    if (client.userRole !== 'DELIVERY_PERSON') {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Stocker la position (à faire en base de données pour l'historique)
    // Émettre aux clients qui suivent cette commande
    const room = `order:${data.orderId}`;

    this.server.to(room).emit('delivery:location', {
      orderId: data.orderId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Livreur met à jour son statut de disponibilité
   */
  @SubscribeMessage('delivery:status')
  handleDeliveryStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { available: boolean },
  ) {
    if (client.userRole !== 'DELIVERY_PERSON') {
      return;
    }

    if (data.available) {
      client.join('role:delivery');
      this.logger.log(`Courier ${client.userId} is now available`);
    } else {
      client.leave('role:delivery');
      this.logger.log(`Courier ${client.userId} is now unavailable`);
    }
  }

  // ============================================
  // LIVREUR: ACCEPTER/REFUSER MISSION
  // ============================================

  /**
   * Livreur accepte une mission
   */
  @SubscribeMessage('delivery:accept')
  handleAcceptDelivery(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    // L'acceptation réelle se fait via API REST
    // Ici on confirme juste la réception
    client.emit('delivery:accept_ack', {
      orderId: data.orderId,
      accepted: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Livreur refuse une mission
   */
  @SubscribeMessage('delivery:reject')
  handleRejectDelivery(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; reason?: string },
  ) {
    client.emit('delivery:reject_ack', {
      orderId: data.orderId,
      rejected: true,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });
  }
}