import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalRestaurants,
      activeOrders,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: 'SUCCESS' },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.restaurant.count(),
      this.prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.CONFIRMED,
              OrderStatus.PREPARING,
              OrderStatus.READY,
              OrderStatus.IN_TRANSIT,
            ],
          },
        },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.PENDING },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      totalUsers,
      totalRestaurants,
      activeOrders,
      pendingOrders,
    };
  }

  async getRecentActivity() {
    const orders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      userName: [order.client.firstName, order.client.lastName]
        .filter(Boolean)
        .join(' ') || order.client.phone,
      restaurantName: order.restaurant.name,
    }));
  }

  async getPendingDeliverers() {
    return this.prisma.user.findMany({
      where: { role: UserRole.DELIVERY_PERSON, status: 'PENDING' as any },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        vehicleType: true, vehiclePlate: true, createdAt: true,
        documents: { select: { type: true, number: true, fileUrl: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllDeliverers() {
    return this.prisma.user.findMany({
      where: { role: UserRole.DELIVERY_PERSON },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        status: true, vehicleType: true, isOnline: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDeliverer(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' as any },
      select: { id: true, status: true, phone: true },
    });
  }

  async rejectDeliverer(id: string, reason?: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' as any },
      select: { id: true, status: true, phone: true },
    });
  }
}
