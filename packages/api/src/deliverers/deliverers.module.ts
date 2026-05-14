import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliverersController } from './deliverers.controller';
import { DeliverersService } from './deliverers.service';

@Module({ controllers: [DeliverersController], providers: [DeliverersService, PrismaService], exports: [DeliverersService] })
export class DeliverersModule {}
