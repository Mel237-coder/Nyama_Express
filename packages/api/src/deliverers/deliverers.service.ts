import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDelivererDto } from './dto/register-deliverer.dto';
import { UpdateDelivererStatusDto } from './dto/update-status.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UserRole, UserStatus, DeliveryStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class DeliverersService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDelivererDto) {
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.DELIVERY_PERSON,
        status: UserStatus.PENDING,
        vehicleType: dto.vehicleType,
        vehiclePlate: dto.vehiclePlate,
        documents: {
          create: [
            { type: 'CNI' as any, number: dto.cniNumber, fileUrl: dto.cniPhotoUrl },
            { type: 'PASSPORT' as any, number: `SELFIE_${dto.phone}`, fileUrl: dto.selfieUrl },
          ],
        },
      },
      select: { id: true, phone: true, firstName: true, lastName: true, role: true, status: true, vehicleType: true },
    });
    return user;
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isOnline: true, currentLat: true, currentLng: true, status: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateStatus(userId: string, dto: UpdateDelivererStatusDto) {
    const updates: any = {};
    if (dto.status === DeliveryStatus.ASSIGNED) updates.isOnline = true;
    return this.prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { isOnline: true, status: true },
    });
  }

  async setOnline(userId: string, online: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: online },
      select: { id: true, isOnline: true },
    });
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { currentLat: dto.latitude, currentLng: dto.longitude, lastLocationAt: new Date() },
      select: { currentLat: true, currentLng: true, lastLocationAt: true },
    });
  }

  async getMissions(userId: string, status?: string) {
    const where: any = {};
    if (status === 'available') { where.status = OrderStatus.READY; where.deliveryPersonId = null; }
    else if (status === 'active') { where.deliveryPersonId = userId; where.status = { in: [OrderStatus.IN_TRANSIT, OrderStatus.READY] }; }
    else if (status === 'history') { where.deliveryPersonId = userId; where.status = OrderStatus.DELIVERED; }
    return this.prisma.order.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: {
        restaurant: { select: { id: true, name: true, address: true, latitude: true, longitude: true, phone: true } },
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        items: { include: { menuItem: { select: { name: true, price: true } } } },
      },
    });
  }

  async acceptMission(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryPersonId) throw new ForbiddenException('Mission already assigned');
    if (order.status !== OrderStatus.READY) throw new ForbiddenException('Order not ready for delivery');
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPersonId: userId,
        status: OrderStatus.IN_TRANSIT,
        statusHistory: { push: { status: OrderStatus.IN_TRANSIT, timestamp: new Date().toISOString() } },
      },
      include: { restaurant: { select: { id: true, name: true, address: true, latitude: true, longitude: true, phone: true } }, client: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    });
    await this.prisma.deliveryTracking.create({
      data: { orderId, deliveryPersonId: userId, status: DeliveryStatus.ASSIGNED },
    });
    return updated;
  }

  async updateMissionStatus(userId: string, orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryPersonId !== userId) throw new ForbiddenException('Not your mission');
    const data: any = { status, statusHistory: { push: { status, timestamp: new Date().toISOString() } } };
    if (status === OrderStatus.DELIVERED) data.deliveredAt = new Date();
    return this.prisma.order.update({ where: { id: orderId }, data, include: { restaurant: { select: { id: true, name: true } }, client: { select: { id: true, firstName: true, lastName: true } } } });
  }

  async getEarnings(userId: string) {
    const deliveredOrders = await this.prisma.order.findMany({
      where: { deliveryPersonId: userId, status: OrderStatus.DELIVERED },
      select: { id: true, deliveryFee: true, total: true, createdAt: true, restaurant: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const commissionPercent = parseInt(process.env.PLATFORM_COMMISSION_PERCENT || '15');
    const earnings = deliveredOrders.map(order => ({ ...order, commission: Math.round(order.deliveryFee * (commissionPercent / 100)), earning: Math.round(order.deliveryFee * (1 - commissionPercent / 100)) }));
    const totalEarned = earnings.reduce((sum, e) => sum + e.earning, 0);
    const withdrawals = await this.prisma.withdrawal.findMany({ where: { userId, status: { in: ['COMPLETED', 'PROCESSING'] } }, select: { amount: true } });
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    return { totalEarned, totalWithdrawn, balance: totalEarned - totalWithdrawn, history: earnings };
  }

  async createWithdrawal(userId: string, dto: CreateWithdrawalDto) {
    const { balance } = await this.getEarnings(userId);
    if (dto.amount > balance) throw new ForbiddenException('Insufficient balance');
    return this.prisma.withdrawal.create({ data: { userId, amount: dto.amount, provider: dto.provider, providerAccount: dto.providerAccount } });
  }

  async getWithdrawals(userId: string) {
    return this.prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, include: { documents: true, addresses: true } });
  }

  async updateProfile(userId: string, data: Partial<{ vehicleType: any; vehiclePlate: string }>) {
    return this.prisma.user.update({ where: { id: userId }, data, select: { id: true, vehicleType: true, vehiclePlate: true } });
  }
}
