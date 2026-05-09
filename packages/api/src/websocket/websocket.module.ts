// ============================================
// Module WebSocket
// Gère les connexions temps réel
// ============================================

import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [WebsocketGateway, WebsocketService, PrismaService],
  exports: [WebsocketService],
})
export class WebsocketModule {}