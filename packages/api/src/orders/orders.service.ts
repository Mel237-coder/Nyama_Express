import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    return this.prisma.order.create({
      data: {
        ...data,
        clientId: userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
      include: { items: true, restaurant: true },
    });
  }

  async findAllByClient(clientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { restaurant: { select: { name: true } }, items: true },
      }),
      this.prisma.order.count({ where: { clientId } }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string, userId: string, role: string) {
    const where: any = { id };
    if (role === 'CLIENT') where.clientId = userId;

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        client: { select: { firstName: true, lastName: true, phone: true } },
        deliveryPerson: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    if (!order) throw new NotFoundException('Commande non trouvée');
    return order;
  }

  async findAllAdmin(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: { select: { name: true } },
          client: { select: { firstName: true, lastName: true, phone: true } },
          items: true,
        },
      }),
      this.prisma.order.count(),
    ]);
    return { data, total, page, limit };
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async confirmDelivery(id: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.SUCCESS, deliveredAt: new Date() },
    });
  }

  async getTracking(orderId: string) {
    const tracking = await this.prisma.deliveryTracking.findFirst({
      where: { orderId },
      orderBy: { updatedAt: 'desc' },
    });
    return tracking || { orderId, status: 'PENDING', latitude: null, longitude: null, updatedAt: new Date() };
  }
}
