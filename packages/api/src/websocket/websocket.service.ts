// ============================================
// Service WebSocket pour temps réel
// Gestion des notifications de commande et géolocalisation
// ============================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@Injectable()
export class WebsocketService implements OnModuleInit {
  private readonly logger = new Logger(WebsocketService.name);
  private server: Server;
  private pubClient: ReturnType<typeof createClient>;
  private subClient: ReturnType<typeof createClient>;

  // Rooms par type d'utilisateur
  private userRooms = new Map<string, string[]>(); // userId -> rooms[]

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // En développement, onSkip l'adaptateur Redis
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      try {
        this.pubClient = createClient({ url: redisUrl });
        this.subClient = createClient({ url: redisUrl });

        await this.pubClient.connect();
        await this.subClient.connect();

        // Lier l'adapter au serveur (sera fait dans le gateway)
        this.logger.log('WebSocket Redis adapter configured');
      } catch (error) {
        this.logger.warn(`Redis not available: ${error.message}. Using in-memory adapter.`);
      }
    } else {
      this.logger.log('Redis not configured. Using in-memory WebSocket adapter.');
    }
  }

  /**
   * Authentifie une connexion Socket.io
   */
  authenticateSocket(socket: AuthenticatedSocket, token: string): boolean {
    try {
      // Vérifier le token JWT
      const jwt = require('jsonwebtoken');
      const secret = this.configService.get<string>('JWT_SECRET');

      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;

      this.logger.debug(`Socket authenticated: ${socket.userId} (${socket.userRole})`);
      return true;
    } catch (error) {
      this.logger.warn(`Socket authentication failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Assigne un socket à une room (ex: room d'une commande)
   */
  joinRoom(socket: AuthenticatedSocket, room: string) {
    socket.join(room);

    // Tracker les rooms de l'utilisateur
    if (socket.userId) {
      const rooms = this.userRooms.get(socket.userId) || [];
      if (!rooms.includes(room)) {
        rooms.push(room);
        this.userRooms.set(socket.userId, rooms);
      }
    }
  }

  /**
   * Retire un socket d'une room
   */
  leaveRoom(socket: AuthenticatedSocket, room: string) {
    socket.leave(room);

    if (socket.userId) {
      const rooms = this.userRooms.get(socket.userId) || [];
      const index = rooms.indexOf(room);
      if (index > -1) {
        rooms.splice(index, 1);
        this.userRooms.set(socket.userId, rooms);
      }
    }
  }

  /**
   * Envoie un événement à tous les sockets d'une room
   */
  emitToRoom(room: string, event: string, data: any) {
    if (this.server) {
      this.server.to(room).emit(event, data);
    }
  }

  /**
   * Envoie un événement à un utilisateur spécifique
   */
  emitToUser(userId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }

  /**
   * Émet un événement à tous les livreurs disponibles
   */
  emitToDeliverers(event: string, data: any) {
    if (this.server) {
      this.server.to('role:delivery').emit(event, data);
    }
  }

  /**
   * Gère la déconnexion
   */
  handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.userId) {
      // Nettoyer les rooms
      const rooms = this.userRooms.get(socket.userId) || [];
      rooms.forEach((room) => socket.leave(room));
      this.userRooms.delete(socket.userId);

      this.logger.debug(`Socket disconnected: ${socket.userId}`);
    }
  }

  // ============================================
  // ÉVÉNEMENTS DE COMMANDE
  // ============================================

  /**
   * Notifie le client du changement de statut de commande
   */
  notifyOrderStatusChange(orderId: string, userId: string, status: string, data?: any) {
    this.emitToUser(userId, 'order:status_changed', {
      orderId,
      status,
      timestamp: new Date().toISOString(),
      ...data,
    });

    // Logger pour debug
    this.logger.log(`Order ${orderId} status -> ${status}`);
  }

  /**
   * Notifie le restaurant d'une nouvelle commande
   */
  notifyNewOrder(restaurantOwnerId: string, order: any) {
    this.emitToUser(restaurantOwnerId, 'order:new', {
      order,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`New order notification sent to restaurant ${restaurantOwnerId}`);
  }

  // ============================================
  // ÉVÉNEMENTS DE LIVRAISON
  // ============================================

  /**
   * Envoie une demande de livraison aux livreurs disponibles
   */
  broadcastDeliveryRequest(orderId: string, deliveryData: {
    restaurantName: string;
    restaurantAddress: string;
    pickupCode: string;
    estimatedDistance?: number;
  }) {
    this.emitToDeliverers('delivery:new_request', {
      orderId,
      ...deliveryData,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Delivery request broadcasted for order ${orderId}`);
  }

  /**
   * Notifie le client de la position du livreur
   */
  notifyDeliveryLocation(orderId: string, clientId: string, lat: number, lng: number) {
    this.emitToUser(clientId, 'delivery:location', {
      orderId,
      latitude: lat,
      longitude: lng,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notifie le client quand le livreur récupère la commande
   */
  notifyOrderPickedUp(orderId: string, clientId: string, deliveryPerson: {
    name: string;
    phone: string;
    vehicleType: string;
  }) {
    this.emitToUser(clientId, 'delivery:picked_up', {
      orderId,
      deliveryPerson,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notifie quand le livreur est en approche
   */
  notifyDeliveryApproaching(orderId: string, clientId: string) {
    this.emitToUser(clientId, 'delivery:approaching', {
      orderId,
      message: 'Votre livreur arrive !',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notifie quand la commande est livrée
   */
  notifyOrderDelivered(orderId: string, clientId: string) {
    this.emitToUser(clientId, 'order:delivered', {
      orderId,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================
  // ATTRIBUTION DE LIVRAISON
  // ============================================

  /**
   * Assigne un livreur à une commande (通知 livreur)
   */
  assignDeliveryToCourier(orderId: string, deliveryPersonId: string, deliveryData: {
    restaurantName: string;
    restaurantAddress: string;
    clientAddress: string;
    pickupCode: string;
  }) {
    this.emitToUser(deliveryPersonId, 'delivery:assigned', {
      orderId,
      ...deliveryData,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Delivery ${orderId} assigned to courier ${deliveryPersonId}`);
  }
}