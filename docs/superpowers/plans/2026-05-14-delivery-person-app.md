# Delivery Person App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete delivery person interface (`/deliverer/*`) within the existing Next.js app, plus all backend APIs, WebSocket events, and Prisma schema changes required to support registration, mission lifecycle, tracking, earnings, and withdrawals.

**Architecture:** Route-isolated Next.js pages with a dedicated deliverer layout and bottom navigation. Backend uses a new NestJS `DeliverersModule` alongside extensions to `UsersModule`, `AdminModule`, and the existing WebSocket gateway. Prisma schema extends `User` with vehicle, location, and online status fields.

**Tech Stack:** Next.js 14, React, TailwindCSS, NestJS, Prisma, PostgreSQL, Socket.io, Leaflet

---

## File Structure

```
packages/api/
  prisma/schema.prisma                    -- Add User fields
  src/
    app.module.ts                         -- Import DeliverersModule
    deliverers/
      deliverers.module.ts
      deliverers.controller.ts
      deliverers.service.ts
      deliverers.gateway.ts
      dto/
        register-deliverer.dto.ts
        update-status.dto.ts
        update-location.dto.ts
        create-withdrawal.dto.ts
    users/
      users.controller.ts                 -- Add become-deliverer endpoint
      users.service.ts                    -- Add becomeDeliverer method
    admin/
      admin.controller.ts                 -- Add deliverer management endpoints
      admin.service.ts                    -- Add deliverer approval methods
    websocket/
      websocket.gateway.ts                -- Add mission:* events
      websocket.service.ts              -- Add mission helpers
apps/web/
  src/
    lib/api.ts                            -- Add deliverer API methods
    hooks/useAuth.tsx                     -- Add role-based redirect
    pages/_app.tsx                        -- Conditional layout
    components/deliverer/
      DelivererLayout.tsx
      DelivererBottomNav.tsx
      MissionCard.tsx
      StatusBadge.tsx
      EarningsCard.tsx
      StatusButtons.tsx
      TrackingMap.tsx
    pages/deliverer/
      login.tsx
      register.tsx
      dashboard.tsx
      missions.tsx
      mission/[id].tsx
      tracking.tsx
      earnings.tsx
      withdrawals.tsx
      profile.tsx
```

---

## Phase 1: Prisma Schema

### Task 1: Extend User Model

**Files:**
- Modify: `packages/api/prisma/schema.prisma`

- [ ] **Step 1: Add fields to User model**

Find the `User` model and add these fields before the `createdAt` field:

```prisma
  // Livreur
  vehicleType    VehicleType?
  vehiclePlate   String?
  isOnline       Boolean        @default(false)
  currentLat     Float?
  currentLng     Float?
  lastLocationAt DateTime?
```

- [ ] **Step 2: Run Prisma generate and push**

```bash
cd packages/api
npx prisma generate
npx prisma db push
```

Expected: `Prisma Client` and schema are updated without errors.

- [ ] **Step 3: Commit**

```bash
git add packages/api/prisma/schema.prisma
git commit -m "feat(prisma): add deliverer fields to User model"
```

---

## Phase 2: Backend — Deliverers Module

### Task 2: Create Deliverers DTOs

**Files:**
- Create: `packages/api/src/deliverers/dto/register-deliverer.dto.ts`
- Create: `packages/api/src/deliverers/dto/update-status.dto.ts`
- Create: `packages/api/src/deliverers/dto/update-location.dto.ts`
- Create: `packages/api/src/deliverers/dto/create-withdrawal.dto.ts`

- [ ] **Step 1: Write register-deliverer.dto.ts**

```typescript
import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class RegisterDelivererDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  cniNumber: string;

  @IsString()
  @IsNotEmpty()
  cniPhotoUrl: string;

  @IsString()
  @IsNotEmpty()
  selfieUrl: string;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  @IsString()
  @IsNotEmpty()
  zoneId: string;
}
```

- [ ] **Step 2: Write update-status.dto.ts**

```typescript
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

export class UpdateDelivererStatusDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @IsString()
  @IsOptional()
  orderId?: string;
}
```

- [ ] **Step 3: Write update-location.dto.ts**

```typescript
import { IsNumber, IsString } from 'class-validator';

export class UpdateLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
```

- [ ] **Step 4: Write create-withdrawal.dto.ts**

```typescript
import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsNumber()
  @Min(500)
  amount: number;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerAccount: string;
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/deliverers/dto/
git commit -m "feat(api): add deliverer DTOs"
```

---

### Task 3: Create Deliverers Service

**Files:**
- Create: `packages/api/src/deliverers/deliverers.service.ts`

- [ ] **Step 1: Write deliverers.service.ts**

```typescript
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
    // Create user with DELIVERY_PERSON role and PENDING status
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.DELIVERY_PERSON,
        status: UserStatus.PENDING,
        vehicleType: dto.vehicleType,
        vehiclePlate: dto.vehiclePlate,
        // Create KYC documents
        documents: {
          create: [
            {
              type: 'CNI' as any,
              number: dto.cniNumber,
              fileUrl: dto.cniPhotoUrl,
            },
            {
              type: 'PASSPORT' as any,
              number: `SELFIE_${dto.phone}`,
              fileUrl: dto.selfieUrl,
            },
          ],
        },
      },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        vehicleType: true,
      },
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

    if (dto.status === DeliveryStatus.ASSIGNED) {
      updates.isOnline = true;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...updates },
      select: { isOnline: true, status: true },
    });

    return user;
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
      data: {
        currentLat: dto.latitude,
        currentLng: dto.longitude,
        lastLocationAt: new Date(),
      },
      select: { currentLat: true, currentLng: true, lastLocationAt: true },
    });
  }

  async getMissions(userId: string, status?: string) {
    const where: any = {};

    if (status === 'available') {
      where.status = OrderStatus.READY;
      where.deliveryPersonId = null;
    } else if (status === 'active') {
      where.deliveryPersonId = userId;
      where.status = { in: [OrderStatus.IN_TRANSIT, OrderStatus.READY] };
    } else if (status === 'history') {
      where.deliveryPersonId = userId;
      where.status = OrderStatus.DELIVERED;
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: { id: true, name: true, address: true, latitude: true, longitude: true, phone: true },
        },
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        items: {
          include: { menuItem: { select: { name: true, price: true } } },
        },
      },
    });
  }

  async acceptMission(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryPersonId) throw new ForbiddenException('Mission already assigned');
    if (order.status !== OrderStatus.READY) throw new ForbiddenException('Order not ready for delivery');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPersonId: userId,
        status: OrderStatus.IN_TRANSIT,
        statusHistory: {
          push: { status: OrderStatus.IN_TRANSIT, timestamp: new Date().toISOString() },
        },
      },
      include: {
        restaurant: {
          select: { id: true, name: true, address: true, latitude: true, longitude: true, phone: true },
        },
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    // Create delivery tracking record
    await this.prisma.deliveryTracking.create({
      data: {
        orderId,
        deliveryPersonId: userId,
        status: DeliveryStatus.ASSIGNED,
      },
    });

    return updated;
  }

  async updateMissionStatus(userId: string, orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryPersonId !== userId) throw new ForbiddenException('Not your mission');

    const data: any = {
      status,
      statusHistory: {
        push: { status, timestamp: new Date().toISOString() },
      },
    };

    if (status === OrderStatus.DELIVERED) {
      data.deliveredAt = new Date();
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        restaurant: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getEarnings(userId: string) {
    const deliveredOrders = await this.prisma.order.findMany({
      where: {
        deliveryPersonId: userId,
        status: OrderStatus.DELIVERED,
      },
      select: {
        id: true,
        deliveryFee: true,
        total: true,
        createdAt: true,
        restaurant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const commissionPercent = parseInt(process.env.PLATFORM_COMMISSION_PERCENT || '15');

    const earnings = deliveredOrders.map((order) => ({
      ...order,
      commission: Math.round(order.deliveryFee * (commissionPercent / 100)),
      earning: Math.round(order.deliveryFee * (1 - commissionPercent / 100)),
    }));

    const totalEarned = earnings.reduce((sum, e) => sum + e.earning, 0);

    // Calculate withdrawals
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { userId, status: { in: ['COMPLETED', 'PROCESSING'] } },
      select: { amount: true },
    });

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    return {
      totalEarned,
      totalWithdrawn,
      balance: totalEarned - totalWithdrawn,
      history: earnings,
    };
  }

  async createWithdrawal(userId: string, dto: CreateWithdrawalDto) {
    const { balance } = await this.getEarnings(userId);
    if (dto.amount > balance) throw new ForbiddenException('Insufficient balance');

    return this.prisma.withdrawal.create({
      data: {
        userId,
        amount: dto.amount,
        provider: dto.provider,
        providerAccount: dto.providerAccount,
      },
    });
  }

  async getWithdrawals(userId: string) {
    return this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: true,
        addresses: true,
      },
    });
  }

  async updateProfile(userId: string, data: Partial<{ vehicleType: any; vehiclePlate: string }>) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, vehicleType: true, vehiclePlate: true },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/deliverers/deliverers.service.ts
git commit -m "feat(api): add deliverers service"
```

---

### Task 4: Create Deliverers Controller

**Files:**
- Create: `packages/api/src/deliverers/deliverers.controller.ts`

- [ ] **Step 1: Write deliverers.controller.ts**

```typescript
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DeliverersService } from './deliverers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RegisterDelivererDto } from './dto/register-deliverer.dto';
import { UpdateDelivererStatusDto } from './dto/update-status.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@ApiTags('Deliverers')
@Controller('deliverers')
export class DeliverersController {
  constructor(private deliverersService: DeliverersService) {}

  @Post('register')
  async register(@Body() dto: RegisterDelivererDto) {
    return this.deliverersService.register(dto);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async getStatus(@Request() req) {
    return this.deliverersService.getStatus(req.user.userId);
  }

  @Patch('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async updateStatus(@Request() req, @Body() dto: UpdateDelivererStatusDto) {
    return this.deliverersService.updateStatus(req.user.userId, dto);
  }

  @Post('online')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async setOnline(@Request() req) {
    return this.deliverersService.setOnline(req.user.userId, true);
  }

  @Post('offline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async setOffline(@Request() req) {
    return this.deliverersService.setOnline(req.user.userId, false);
  }

  @Post('location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async updateLocation(@Request() req, @Body() dto: UpdateLocationDto) {
    return this.deliverersService.updateLocation(req.user.userId, dto);
  }

  @Get('missions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async getMissions(@Request() req, @Query('status') status?: string) {
    return this.deliverersService.getMissions(req.user.userId, status);
  }

  @Post('missions/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async acceptMission(@Request() req, @Param('id') orderId: string) {
    return this.deliverersService.acceptMission(req.user.userId, orderId);
  }

  @Patch('missions/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async updateMissionStatus(
    @Request() req,
    @Param('id') orderId: string,
    @Body('status') status: any,
  ) {
    return this.deliverersService.updateMissionStatus(req.user.userId, orderId, status);
  }

  @Get('earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async getEarnings(@Request() req) {
    return this.deliverersService.getEarnings(req.user.userId);
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async getWithdrawals(@Request() req) {
    return this.deliverersService.getWithdrawals(req.user.userId);
  }

  @Post('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async createWithdrawal(@Request() req, @Body() dto: CreateWithdrawalDto) {
    return this.deliverersService.createWithdrawal(req.user.userId, dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async getProfile(@Request() req) {
    return this.deliverersService.getProfile(req.user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PERSON)
  @ApiBearerAuth()
  async updateProfile(@Request() req, @Body() data: any) {
    return this.deliverersService.updateProfile(req.user.userId, data);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/deliverers/deliverers.controller.ts
git commit -m "feat(api): add deliverers controller"
```

---

### Task 5: Create Deliverers Module

**Files:**
- Create: `packages/api/src/deliverers/deliverers.module.ts`

- [ ] **Step 1: Write deliverers.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliverersController } from './deliverers.controller';
import { DeliverersService } from './deliverers.service';
import { DeliverersGateway } from './deliverers.gateway';

@Module({
  controllers: [DeliverersController],
  providers: [DeliverersService, DeliverersGateway, PrismaService],
  exports: [DeliverersService],
})
export class DeliverersModule {}
```

- [ ] **Step 2: Import in app.module.ts**

Modify `packages/api/src/app.module.ts`:

```typescript
import { DeliverersModule } from './deliverers/deliverers.module';
```

Add `DeliverersModule` to the `imports` array after `WebsocketModule`.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/deliverers/deliverers.module.ts packages/api/src/app.module.ts
git commit -m "feat(api): wire up DeliverersModule"
```

---

## Phase 3: Backend — Users & Admin Extensions

### Task 6: Add Become-Deliverer Endpoint

**Files:**
- Modify: `packages/api/src/users/users.controller.ts`
- Modify: `packages/api/src/users/users.service.ts`

- [ ] **Step 1: Add endpoint to users.controller.ts**

Add inside the `UsersController` class:

```typescript
  @Patch('become-deliverer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async becomeDeliverer(@Request() req, @Body() data: {
    cniNumber: string;
    cniPhotoUrl: string;
    selfieUrl: string;
    vehicleType: string;
    vehiclePlate?: string;
    zoneId: string;
  }) {
    return this.usersService.becomeDeliverer(req.user.userId, data);
  }
```

- [ ] **Step 2: Add method to users.service.ts**

Add inside the `UsersService` class:

```typescript
  async becomeDeliverer(userId: string, data: {
    cniNumber: string;
    cniPhotoUrl: string;
    selfieUrl: string;
    vehicleType: any;
    vehiclePlate?: string;
    zoneId: string;
  }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'DELIVERY_PERSON' as any,
        status: 'PENDING' as any,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        documents: {
          create: [
            {
              type: 'CNI' as any,
              number: data.cniNumber,
              fileUrl: data.cniPhotoUrl,
            },
            {
              type: 'PASSPORT' as any,
              number: `SELFIE_${userId}`,
              fileUrl: data.selfieUrl,
            },
          ],
        },
      },
      select: {
        id: true,
        phone: true,
        role: true,
        status: true,
        vehicleType: true,
      },
    });

    return user;
  }
```

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/users/users.controller.ts packages/api/src/users/users.service.ts
git commit -m "feat(api): add become-deliverer endpoint"
```

---

### Task 7: Add Admin Deliverer Endpoints

**Files:**
- Modify: `packages/api/src/admin/admin.controller.ts`
- Modify: `packages/api/src/admin/admin.service.ts`

- [ ] **Step 1: Add endpoints to admin.controller.ts**

Replace the entire file with:

```typescript
import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('activity')
  @Roles(UserRole.ADMIN)
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  @Get('deliverers/pending')
  @Roles(UserRole.ADMIN)
  async getPendingDeliverers() {
    return this.adminService.getPendingDeliverers();
  }

  @Get('deliverers')
  @Roles(UserRole.ADMIN)
  async getAllDeliverers() {
    return this.adminService.getAllDeliverers();
  }

  @Patch('deliverers/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveDeliverer(@Param('id') id: string) {
    return this.adminService.approveDeliverer(id);
  }

  @Patch('deliverers/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectDeliverer(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.rejectDeliverer(id, reason);
  }
}
```

- [ ] **Step 2: Add methods to admin.service.ts**

Add inside the `AdminService` class after `getRecentActivity`:

```typescript
  async getPendingDeliverers() {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.DELIVERY_PERSON,
        status: 'PENDING' as any,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        vehicleType: true,
        vehiclePlate: true,
        createdAt: true,
        documents: {
          select: { type: true, number: true, fileUrl: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllDeliverers() {
    return this.prisma.user.findMany({
      where: { role: UserRole.DELIVERY_PERSON },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        vehicleType: true,
        isOnline: true,
        createdAt: true,
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
```

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/admin/admin.controller.ts packages/api/src/admin/admin.service.ts
git commit -m "feat(api): add admin deliverer management endpoints"
```

---

## Phase 4: Backend — WebSocket Extensions

### Task 8: Extend WebSocket Gateway

**Files:**
- Modify: `packages/api/src/websocket/websocket.gateway.ts`
- Modify: `packages/api/src/websocket/websocket.service.ts`

- [ ] **Step 1: Add mission events to websocket.gateway.ts**

Add the following handlers inside the `WebsocketGateway` class, after the existing `handleRejectDelivery`:

```typescript
  // ============================================
  // MISSIONS
  // ============================================

  @SubscribeMessage('deliverer:online')
  handleDelivererOnline(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lat: number; lng: number },
  ) {
    if (client.userRole !== 'DELIVERY_PERSON') {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }
    client.join('role:delivery');
    this.logger.log(`Courier ${client.userId} is now online at ${data.lat},${data.lng}`);
    client.emit('deliverer:online_ack', { success: true });
  }

  @SubscribeMessage('deliverer:offline')
  handleDelivererOffline(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userRole !== 'DELIVERY_PERSON') {
      return;
    }
    client.leave('role:delivery');
    this.logger.log(`Courier ${client.userId} is now offline`);
    client.emit('deliverer:offline_ack', { success: true });
  }

  @SubscribeMessage('mission:new')
  handleNewMission(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; restaurantId: string },
  ) {
    // Broadcast to all available delivery persons
    this.server.to('role:delivery').emit('mission:new', {
      orderId: data.orderId,
      restaurantId: data.restaurantId,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`New mission ${data.orderId} broadcasted to delivery pool`);
  }

  @SubscribeMessage('mission:assigned')
  handleMissionAssigned(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; delivererId: string },
  ) {
    this.server.to(`user:${data.delivererId}`).emit('mission:assigned', {
      orderId: data.orderId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('mission:cancelled')
  handleMissionCancelled(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; reason?: string },
  ) {
    this.server.to(`order:${data.orderId}`).emit('mission:cancelled', {
      orderId: data.orderId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });
  }
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/websocket/websocket.gateway.ts
git commit -m "feat(api): add deliverer websocket events"
```

---

## Phase 5: Frontend — API Client & Auth

### Task 9: Extend API Client

**Files:**
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add deliverer methods to api.ts**

Add these methods inside the `ApiClient` class, after the existing `uploadImage` method:

```typescript
  // ============================================
  // DELIVERERS
  // ============================================

  async registerDeliverer(data: {
    phone: string;
    firstName: string;
    lastName: string;
    cniNumber: string;
    cniPhotoUrl: string;
    selfieUrl: string;
    vehicleType: string;
    vehiclePlate?: string;
    zoneId: string;
  }) {
    return this.fetch('/api/deliverers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDelivererStatus(token: string) {
    return this.fetch('/api/deliverers/status', { token });
  }

  async setDelivererOnline(token: string) {
    return this.fetch('/api/deliverers/online', { method: 'POST', token });
  }

  async setDelivererOffline(token: string) {
    return this.fetch('/api/deliverers/offline', { method: 'POST', token });
  }

  async updateDelivererLocation(token: string, lat: number, lng: number) {
    return this.fetch('/api/deliverers/location', {
      method: 'POST',
      body: JSON.stringify({ latitude: lat, longitude: lng }),
      token,
    });
  }

  async getMissions(token: string, status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.fetch(`/api/deliverers/missions${query}`, { token });
  }

  async acceptMission(orderId: string, token: string) {
    return this.fetch(`/api/deliverers/missions/${orderId}/accept`, {
      method: 'POST',
      token,
    });
  }

  async updateMissionStatus(orderId: string, status: string, token: string) {
    return this.fetch(`/api/deliverers/missions/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    });
  }

  async getEarnings(token: string) {
    return this.fetch('/api/deliverers/earnings', { token });
  }

  async getWithdrawals(token: string) {
    return this.fetch('/api/deliverers/withdrawals', { token });
  }

  async createWithdrawal(data: { amount: number; provider: string; providerAccount: string }, token: string) {
    return this.fetch('/api/deliverers/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async getDelivererProfile(token: string) {
    return this.fetch('/api/deliverers/profile', { token });
  }

  async updateDelivererProfile(data: any, token: string) {
    return this.fetch('/api/deliverers/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  // ============================================
  // USERS — BECOME DELIVERER
  // ============================================

  async becomeDeliverer(data: {
    cniNumber: string;
    cniPhotoUrl: string;
    selfieUrl: string;
    vehicleType: string;
    vehiclePlate?: string;
    zoneId: string;
  }, token: string) {
    return this.fetch('/api/users/become-deliverer', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "feat(web): add deliverer API methods"
```

---

### Task 10: Add Role-Based Auth Redirect

**Files:**
- Modify: `apps/web/src/hooks/useAuth.tsx`

- [ ] **Step 1: Add role to User interface and redirect logic**

Update the `User` interface:

```typescript
interface User {
  id: string;
  phone: string;
  paymentPhone?: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  language: string;
  status?: string;
}
```

Add a `redirectByRole` helper after the `verifyOtp` function and call it inside `verifyOtp` after `setUser`:

```typescript
  const redirectByRole = (user: User) => {
    if (typeof window === 'undefined') return;
    if (user.role === 'DELIVERY_PERSON') {
      window.location.href = '/deliverer/dashboard';
    } else if (user.role === 'ADMIN') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/';
    }
  };
```

Inside `verifyOtp`, after `setUser(response.user);`, add:

```typescript
    redirectByRole(response.user);
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/useAuth.tsx
git commit -m "feat(web): add role-based redirect after login"
```

---

## Phase 6: Frontend — Layout & Components

### Task 11: Create DelivererLayout

**Files:**
- Create: `apps/web/src/components/deliverer/DelivererLayout.tsx`

- [ ] **Step 1: Write DelivererLayout.tsx**

```typescript
import { ReactNode } from 'react';
import { DelivererBottomNav } from './DelivererBottomNav';

interface Props {
  children: ReactNode;
}

export function DelivererLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-20">
      <main>{children}</main>
      <DelivererBottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/deliverer/DelivererLayout.tsx
git commit -m "feat(web): add DelivererLayout component"
```

---

### Task 12: Create DelivererBottomNav

**Files:**
- Create: `apps/web/src/components/deliverer/DelivererBottomNav.tsx`

- [ ] **Step 1: Write DelivererBottomNav.tsx**

```typescript
import { useRouter } from 'next/router';
import { ClipboardList, MapPin, Wallet, User } from 'lucide-react';

const navItems = [
  { href: '/deliverer/missions', label: 'Missions', icon: ClipboardList },
  { href: '/deliverer/tracking', label: 'Tracking', icon: MapPin },
  { href: '/deliverer/earnings', label: 'Gains', icon: Wallet },
  { href: '/deliverer/profile', label: 'Profil', icon: User },
];

export function DelivererBottomNav() {
  const router = useRouter();
  const path = router.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? 'text-[#D84315]' : 'text-[#999999]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/deliverer/DelivererBottomNav.tsx
git commit -m "feat(web): add DelivererBottomNav component"
```

---

### Task 13: Create StatusBadge

**Files:**
- Create: `apps/web/src/components/deliverer/StatusBadge.tsx`

- [ ] **Step 1: Write StatusBadge.tsx**

```typescript
interface Props {
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'PENDING' | 'ACTIVE';
}

export function StatusBadge({ status }: Props) {
  const styles: Record<string, string> = {
    ONLINE: 'bg-[#2E7D32] text-white',
    OFFLINE: 'bg-[#999999] text-white',
    BUSY: 'bg-[#D84315] text-white',
    PENDING: 'bg-[#F9A825] text-white',
    ACTIVE: 'bg-[#2E7D32] text-white',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || styles.OFFLINE}`}>
      {status === 'ONLINE' ? 'En ligne' : status === 'OFFLINE' ? 'Hors ligne' : status === 'BUSY' ? 'En mission' : status === 'PENDING' ? 'En attente' : 'Actif'}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/deliverer/StatusBadge.tsx
git commit -m "feat(web): add StatusBadge component"
```

---

### Task 14: Create MissionCard

**Files:**
- Create: `apps/web/src/components/deliverer/MissionCard.tsx`

- [ ] **Step 1: Write MissionCard.tsx**

```typescript
import { MapPin, Clock, Phone } from 'lucide-react';

interface Props {
  mission: any;
  onAccept?: () => void;
  showAccept?: boolean;
}

export function MissionCard({ mission, onAccept, showAccept }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-[#1A1A1A] text-lg">{mission.restaurant?.name || 'Restaurant'}</h3>
        <span className="text-[#D84315] font-bold">{mission.deliveryFee} FCFA</span>
      </div>

      <div className="space-y-2 text-sm text-[#666666]">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#D84315]" />
          <span>Restaurant: {mission.restaurant?.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#2E7D32]" />
          <span>Client: {mission.deliveryAddress}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#999999]" />
          <span>{mission.restaurant?.phone || mission.client?.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#999999]" />
          <span>#{mission.id?.slice(-6)}</span>
        </div>
      </div>

      {showAccept && (
        <button
          onClick={onAccept}
          className="w-full mt-4 bg-[#D84315] text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform"
        >
          Accepter la mission
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/deliverer/MissionCard.tsx
git commit -m "feat(web): add MissionCard component"
```

---

### Task 15: Create StatusButtons

**Files:**
- Create: `apps/web/src/components/deliverer/StatusButtons.tsx`

- [ ] **Step 1: Write StatusButtons.tsx**

```typescript
interface Props {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

const buttons = [
  { status: 'PICKED_UP', label: 'Commande récupérée', color: 'bg-[#F9A825]' },
  { status: 'IN_TRANSIT', label: 'En livraison', color: 'bg-[#D84315]' },
  { status: 'DELIVERED', label: 'Livrée', color: 'bg-[#2E7D32]' },
];

export function StatusButtons({ currentStatus, onStatusChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.status}
          onClick={() => onStatusChange(btn.status)}
          className={`${btn.color} text-white text-xs font-bold py-3 rounded-xl active:scale-[0.98] transition-transform`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/deliverer/StatusButtons.tsx
git commit -m "feat(web): add StatusButtons component"
```

---

### Task 16: Create TrackingMap

**Files:**
- Create: `apps/web/src/components/deliverer/TrackingMap.tsx`

- [ ] **Step 1: Write TrackingMap.tsx**

```typescript
import { useEffect, useRef } from 'react';

interface Props {
  lat: number;
  lng: number;
  restaurantLat?: number;
  restaurantLng?: number;
  clientLat?: number;
  clientLng?: number;
}

export function TrackingMap({ lat, lng, restaurantLat, restaurantLng, clientLat, clientLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      const map = L.default.map(mapRef.current!).setView([lat, lng], 14);
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      L.default.marker([lat, lng]).addTo(map).bindPopup('Vous');

      if (restaurantLat && restaurantLng) {
        L.default.marker([restaurantLat, restaurantLng]).addTo(map).bindPopup('Restaurant');
      }
      if (clientLat && clientLng) {
        L.default.marker([clientLat, clientLng]).addTo(map).bindPopup('Client');
      }
    });
  }, [lat, lng, restaurantLat, restaurantLng, clientLat, clientLng]);

  return <div ref={mapRef} className="w-full h-64 rounded-2xl border border-[#E8E4DC]" />;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/deliverer/TrackingMap.tsx
git commit -m "feat(web): add TrackingMap component"
```

---

### Task 17: Create EarningsCard

**Files:**
- Create: `apps/web/src/components/deliverer/EarningsCard.tsx`

- [ ] **Step 1: Write EarningsCard.tsx**

```typescript
import { Wallet, TrendingUp, ArrowDownCircle } from 'lucide-react';

interface Props {
  totalEarned: number;
  totalWithdrawn: number;
  balance: number;
}

export function EarningsCard({ totalEarned, totalWithdrawn, balance }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-center">
        <TrendingUp className="w-6 h-6 text-[#2E7D32] mx-auto mb-2" />
        <p className="text-[#1A1A1A] font-bold">{totalEarned}</p>
        <p className="text-[#999999] text-xs">Gagné</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-center">
        <ArrowDownCircle className="w-6 h-6 text-[#D84315] mx-auto mb-2" />
        <p className="text-[#1A1A1A] font-bold">{totalWithdrawn}</p>
        <p className="text-[#999999] text-xs">Retiré</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-center">
        <Wallet className="w-6 h-6 text-[#F9A825] mx-auto mb-2" />
        <p className="text-[#1A1A1A] font-bold">{balance}</p>
        <p className="text-[#999999] text-xs">Solde</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/deliverer/EarningsCard.tsx
git commit -m "feat(web): add EarningsCard component"
```

---

## Phase 7: Frontend — Pages

### Task 18: Update _app.tsx for Conditional Layout

**Files:**
- Modify: `apps/web/src/pages/_app.tsx`

- [ ] **Step 1: Replace _app.tsx with conditional layout**

Replace the entire file with:

```typescript
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';

import { LanguageProvider } from '../hooks/useLanguage';
import { AuthProvider } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';
import { DelivererLayout } from '../components/deliverer/DelivererLayout';

import { AlertTriangle } from 'lucide-react';
import { FloatingCartBar } from '../components/layout/FloatingCartBar';
import { NeonBottomNav } from '../components/layout/NeonBottomNav';

export default function App({ Component, pageProps }: AppProps) {
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const isDelivererRoute = router.pathname.startsWith('/deliverer');
  const isDelivererLogin = router.pathname === '/deliverer/login' || router.pathname === '/deliverer/register';

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#FF3366]/90 text-white text-center text-sm py-2 px-4">
              <AlertTriangle className="w-4 h-4 inline-block mr-1" style={{ color: 'white' }} /> Pas de connexion — Mode limité
            </div>
          )}

          {isDelivererRoute && !isDelivererLogin ? (
            <DelivererLayout>
              <Component {...pageProps} />
            </DelivererLayout>
          ) : (
            <>
              <div className="min-h-screen pb-24">
                <Component {...pageProps} />
              </div>
              <FloatingCartBar />
              <NeonBottomNav />
            </>
          )}
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/_app.tsx
git commit -m "feat(web): conditional layout for deliverer routes"
```

---

### Task 19: Create Deliverer Login Page

**Files:**
- Create: `apps/web/src/pages/deliverer/login.tsx`

- [ ] **Step 1: Write login.tsx**

```typescript
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { Phone, ArrowRight } from 'lucide-react';

export default function DelivererLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const { login, verifyOtp } = useAuth();
  const router = useRouter();

  const handleRequestOtp = async () => {
    await login(phone);
    setStep('otp');
  };

  const handleVerify = async () => {
    await verifyOtp(phone, otp);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-1 text-center">FoodApp Livreur</h1>
        <p className="text-[#666666] text-sm text-center mb-8">Connectez-vous pour commencer</p>

        {step === 'phone' ? (
          <>
            <div className="relative mb-4">
              <Phone className="absolute left-4 top-3.5 w-5 h-5 text-[#999999]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="6XX XXX XXX"
                className="w-full bg-[#F5F0E8] rounded-2xl pl-12 pr-4 py-3 text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#D84315]"
              />
            </div>
            <button
              onClick={handleRequestOtp}
              className="w-full bg-[#D84315] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#666666] mb-4 text-center">Code envoyé à {phone}</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full bg-[#F5F0E8] rounded-2xl px-4 py-3 text-center text-2xl tracking-[0.5em] text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#D84315] mb-4"
            />
            <button
              onClick={handleVerify}
              className="w-full bg-[#D84315] text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform"
            >
              Vérifier
            </button>
          </>
        )}

        <p className="text-center text-sm text-[#999999] mt-6">
          Pas encore inscrit ?{' '}
          <button onClick={() => router.push('/deliverer/register')} className="text-[#D84315] font-bold">
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/deliverer/login.tsx
git commit -m "feat(web): add deliverer login page"
```

---

### Task 20: Create Deliverer Register Page

**Files:**
- Create: `apps/web/src/pages/deliverer/register.tsx`

- [ ] **Step 1: Write register.tsx**

```typescript
import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { Phone, User, CreditCard, Camera, Bike, Car } from 'lucide-react';

export default function DelivererRegister() {
  const router = useRouter();
  const [form, setForm] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    cniNumber: '',
    cniPhotoUrl: '',
    selfieUrl: '',
    vehicleType: 'MOTORCYCLE',
    vehiclePlate: '',
    zoneId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.registerDeliverer(form);
      router.push('/deliverer/login');
    } catch (e) {
      alert('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-[#F5F0E8] p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-1">Devenir livreur</h1>
        <p className="text-[#666666] text-sm mb-6">Remplissez vos informations pour commencer</p>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4">
            <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><User className="w-5 h-5 text-[#D84315]" /> Identité</h2>
            <div className="space-y-3">
              <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Prénom" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Nom" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-4 h-4 text-[#999999]" />
                <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="6XX XXX XXX" className="w-full bg-[#F5F0E8] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4">
            <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#D84315]" /> Documents</h2>
            <div className="space-y-3">
              <input value={form.cniNumber} onChange={(e) => update('cniNumber', e.target.value)} placeholder="Numéro CNI" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              <input value={form.cniPhotoUrl} onChange={(e) => update('cniPhotoUrl', e.target.value)} placeholder="URL photo CNI (Cloudinary)" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              <input value={form.selfieUrl} onChange={(e) => update('selfieUrl', e.target.value)} placeholder="URL selfie (Cloudinary)" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4">
            <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><Bike className="w-5 h-5 text-[#D84315]" /> Véhicule</h2>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {['MOTORCYCLE', 'BICYCLE', 'CAR', 'FOOT'].map((type) => (
                <button
                  key={type}
                  onClick={() => update('vehicleType', type)}
                  className={`py-2 rounded-xl text-xs font-bold ${form.vehicleType === type ? 'bg-[#D84315] text-white' : 'bg-[#F5F0E8] text-[#666666]'}`}
                >
                  {type === 'MOTORCYCLE' ? 'Moto' : type === 'BICYCLE' ? 'Vélo' : type === 'CAR' ? 'Voiture' : 'Pied'}
                </button>
              ))}
            </div>
            <input value={form.vehiclePlate} onChange={(e) => update('vehiclePlate', e.target.value)} placeholder="Plaque d'immatriculation" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#D84315] text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/deliverer/register.tsx
git commit -m "feat(web): add deliverer register page"
```

---

### Task 21: Create Dashboard Page

**Files:**
- Create: `apps/web/src/pages/deliverer/dashboard.tsx`

- [ ] **Step 1: Write dashboard.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { StatusBadge } from '../../components/deliverer/StatusBadge';
import { Power, MapPin } from 'lucide-react';

export default function DelivererDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) {
      router.push('/deliverer/login');
      return;
    }
    api.getDelivererStatus(token)
      .then((s) => {
        setStatus(s);
        setOnline(s.isOnline);
      })
      .catch(() => router.push('/deliverer/login'))
      .finally(() => setLoading(false));
  }, [token, router]);

  const toggleOnline = async () => {
    if (!token) return;
    if (online) {
      await api.setDelivererOffline(token);
      setOnline(false);
    } else {
      await api.setDelivererOnline(token);
      setOnline(true);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666666]">Chargement...</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-[#666666] text-sm">Bienvenue, livreur</p>
        </div>
        <StatusBadge status={online ? 'ONLINE' : 'OFFLINE'} />
      </div>

      <button
        onClick={toggleOnline}
        className={`w-full py-4 rounded-2xl font-bold text-white mb-6 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${online ? 'bg-[#999999]' : 'bg-[#2E7D32]'}`}
      >
        <Power className="w-5 h-5" />
        {online ? 'Passer hors ligne' : 'Passer en ligne'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push('/deliverer/missions')} className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-left active:scale-[0.98] transition-transform">
          <MapPin className="w-6 h-6 text-[#D84315] mb-2" />
          <p className="font-bold text-[#1A1A1A]">Missions</p>
          <p className="text-[#999999] text-xs">Voir disponibles</p>
        </button>
        <button onClick={() => router.push('/deliverer/earnings')} className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-left active:scale-[0.98] transition-transform">
          <p className="text-2xl font-extrabold text-[#F9A825]">FCFA</p>
          <p className="font-bold text-[#1A1A1A]">Gains</p>
          <p className="text-[#999999] text-xs">Historique</p>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/deliverer/dashboard.tsx
git commit -m "feat(web): add deliverer dashboard page"
```

---

### Task 22: Create Missions Page

**Files:**
- Create: `apps/web/src/pages/deliverer/missions.tsx`

- [ ] **Step 1: Write missions.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { MissionCard } from '../../components/deliverer/MissionCard';

export default function DelivererMissions() {
  const [missions, setMissions] = useState<any[]>([]);
  const [tab, setTab] = useState<'available' | 'active' | 'history'>('available');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    loadMissions();
  }, [tab, token, router]);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const data = await api.getMissions(token!, tab);
      setMissions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const acceptMission = async (orderId: string) => {
    if (!token) return;
    try {
      await api.acceptMission(orderId, token);
      router.push(`/deliverer/mission/${orderId}`);
    } catch (e) {
      alert('Mission déjà prise ou erreur');
      loadMissions();
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4">Missions</h1>

      <div className="flex gap-2 mb-4">
        {(['available', 'active', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold ${tab === t ? 'bg-[#D84315] text-white' : 'bg-white text-[#666666] border border-[#E8E4DC]'}`}
          >
            {t === 'available' ? 'Disponibles' : t === 'active' ? 'Actives' : 'Historique'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[#999999] text-center py-8">Chargement...</p>
      ) : missions.length === 0 ? (
        <p className="text-[#999999] text-center py-8">Aucune mission</p>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              showAccept={tab === 'available'}
              onAccept={() => acceptMission(mission.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/deliverer/missions.tsx
git commit -m "feat(web): add deliverer missions page"
```

---

### Task 23: Create Mission Detail Page

**Files:**
- Create: `apps/web/src/pages/deliverer/mission/[id].tsx`

- [ ] **Step 1: Write [id].tsx**

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../../lib/api';
import { TrackingMap } from '../../../components/deliverer/TrackingMap';
import { StatusButtons } from '../../../components/deliverer/StatusButtons';
import { ArrowLeft, Phone } from 'lucide-react';

export default function MissionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [mission, setMission] = useState<any>(null);
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!id || !token) return;
    api.getOrder(id as string, token).then(setMission).catch(console.error);
  }, [id, token]);

  const handleStatusChange = async (status: string) => {
    if (!token || !id) return;
    try {
      await api.updateMissionStatus(id as string, status, token);
      if (status === 'DELIVERED') {
        router.push('/deliverer/missions');
      } else {
        api.getOrder(id as string, token).then(setMission);
      }
    } catch (e) {
      alert('Erreur de mise à jour');
    }
  };

  if (!mission) return <div className="p-4 text-[#999999]">Chargement...</div>;

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[#666666] mb-4">
        <ArrowLeft className="w-5 h-5" /> Retour
      </button>

      <h1 className="text-xl font-extrabold text-[#1A1A1A] mb-4">Mission #{mission.id?.slice(-6)}</h1>

      <TrackingMap
        lat={mission.restaurant?.latitude || 3.848}
        lng={mission.restaurant?.longitude || 11.5021}
        restaurantLat={mission.restaurant?.latitude}
        restaurantLng={mission.restaurant?.longitude}
        clientLat={mission.deliveryLatitude}
        clientLng={mission.deliveryLongitude}
      />

      <div className="mt-4 bg-white rounded-2xl border border-[#E8E4DC] p-4">
        <h2 className="font-bold text-[#1A1A1A] mb-2">Restaurant</h2>
        <p className="text-[#666666] text-sm">{mission.restaurant?.name}</p>
        <p className="text-[#666666] text-sm">{mission.restaurant?.address}</p>
        <a href={`tel:${mission.restaurant?.phone}`} className="flex items-center gap-2 text-[#D84315] text-sm mt-2 font-bold">
          <Phone className="w-4 h-4" /> Appeler
        </a>
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-[#E8E4DC] p-4">
        <h2 className="font-bold text-[#1A1A1A] mb-2">Client</h2>
        <p className="text-[#666666] text-sm">{mission.deliveryAddress}</p>
        <p className="text-[#666666] text-sm">{mission.client?.firstName} {mission.client?.lastName}</p>
      </div>

      <div className="mt-4">
        <StatusButtons currentStatus={mission.status} onStatusChange={handleStatusChange} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/pages/deliverer/mission/[id].tsx"
git commit -m "feat(web): add mission detail page"
```

---

### Task 24: Create Tracking Page

**Files:**
- Create: `apps/web/src/pages/deliverer/tracking.tsx`

- [ ] **Step 1: Write tracking.tsx**

```typescript
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { TrackingMap } from '../../components/deliverer/TrackingMap';
import { Navigation } from 'lucide-react';

export default function DelivererTracking() {
  const [position, setPosition] = useState({ lat: 3.848, lng: 11.5021 });
  const [activeMission, setActiveMission] = useState<any>(null);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }

    // Get active mission
    api.getMissions(token, 'active').then((missions) => {
      if (missions?.length > 0) setActiveMission(missions[0]);
    });

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        api.updateDelivererLocation(token, latitude, longitude).catch(console.error);
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [token, router]);

  if (!activeMission) {
    return (
      <div className="p-4 flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-[#666666] mb-4">Aucune mission active</p>
          <button onClick={() => router.push('/deliverer/missions')} className="bg-[#D84315] text-white font-bold py-3 px-6 rounded-xl">
            Voir les missions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-extrabold text-[#1A1A1A] mb-4">Tracking</h1>

      <TrackingMap
        lat={position.lat}
        lng={position.lng}
        restaurantLat={activeMission.restaurant?.latitude}
        restaurantLng={activeMission.restaurant?.longitude}
        clientLat={activeMission.deliveryLatitude}
        clientLng={activeMission.deliveryLongitude}
      />

      <div className="mt-4 bg-white rounded-2xl border border-[#E8E4DC] p-4">
        <p className="font-bold text-[#1A1A1A]">{activeMission.restaurant?.name}</p>
        <p className="text-[#666666] text-sm">{activeMission.deliveryAddress}</p>
      </div>

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.deliveryLatitude},${activeMission.deliveryLongitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full bg-[#2E7D32] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Navigation className="w-5 h-5" /> Ouvrir dans Maps
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/deliverer/tracking.tsx
git commit -m "feat(web): add deliverer tracking page"
```

---

### Task 25: Create Earnings Page

**Files:**
- Create: `apps/web/src/pages/deliverer/earnings.tsx`

- [ ] **Step 1: Write earnings.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { EarningsCard } from '../../components/deliverer/EarningsCard';

export default function DelivererEarnings() {
  const [earnings, setEarnings] = useState<any>(null);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getEarnings(token).then(setEarnings).catch(console.error);
  }, [token, router]);

  if (!earnings) return <div className="p-4 text-[#999999]">Chargement...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4">Gains</h1>

      <EarningsCard
        totalEarned={earnings.totalEarned}
        totalWithdrawn={earnings.totalWithdrawn}
        balance={earnings.balance}
      />

      <h2 className="font-bold text-[#1A1A1A] mt-6 mb-3">Historique</h2>
      <div className="space-y-2">
        {earnings.history?.map((item: any) => (
          <div key={item.id} className="bg-white rounded-2xl border border-[#E8E4DC] p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm">{item.restaurant?.name}</p>
              <p className="text-[#999999] text-xs">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#2E7D32]">+{item.earning} FCFA</p>
              <p className="text-[#999999] text-xs">Comm. {item.commission}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/deliverer/withdrawals')}
        className="w-full mt-6 bg-[#D84315] text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-transform"
      >
        Retirer mes gains
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/deliverer/earnings.tsx
git commit -m "feat(web): add deliverer earnings page"
```

---

### Task 26: Create Withdrawals Page

**Files:**
- Create: `apps/web/src/pages/deliverer/withdrawals.tsx`

- [ ] **Step 1: Write withdrawals.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { Wallet, ArrowDownCircle } from 'lucide-react';

export default function DelivererWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('mtn_momo');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(0);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    loadData();
  }, [token, router]);

  const loadData = async () => {
    const [wList, earnings] = await Promise.all([
      api.getWithdrawals(token!),
      api.getEarnings(token!),
    ]);
    setWithdrawals(wList || []);
    setBalance(earnings.balance);
  };

  const handleWithdraw = async () => {
    if (!token) return;
    const numAmount = parseInt(amount);
    if (numAmount < 500) { alert('Montant minimum 500 FCFA'); return; }
    if (numAmount > balance) { alert('Solde insuffisant'); return; }

    try {
      await api.createWithdrawal({ amount: numAmount, provider, providerAccount: phone }, token);
      setAmount('');
      loadData();
    } catch (e) {
      alert('Erreur lors du retrait');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4">Retraits</h1>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 mb-4 text-center">
        <p className="text-[#999999] text-sm">Solde disponible</p>
        <p className="text-3xl font-extrabold text-[#1A1A1A]">{balance} FCFA</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 mb-4">
        <h2 className="font-bold text-[#1A1A1A] mb-3">Nouveau retrait</h2>
        <div className="space-y-3">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant (min 500)" type="number" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]">
            <option value="mtn_momo">MTN MoMo</option>
            <option value="orange_money">Orange Money</option>
          </select>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Numéro de téléphone" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
          <button onClick={handleWithdraw} className="w-full bg-[#D84315] text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform">
            Retirer
          </button>
        </div>
      </div>

      <h2 className="font-bold text-[#1A1A1A] mb-3">Historique</h2>
      <div className="space-y-2">
        {withdrawals.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl border border-[#E8E4DC] p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm">{w.amount} FCFA</p>
              <p className="text-[#999999] text-xs">{w.provider === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${w.status === 'COMPLETED' ? 'bg-[#2E7D32] text-white' : w.status === 'FAILED' ? 'bg-[#D84315] text-white' : 'bg-[#F9A825] text-white'}`}>
              {w.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/deliverer/withdrawals.tsx
git commit -m "feat(web): add deliverer withdrawals page"
```

---

### Task 27: Create Profile Page

**Files:**
- Create: `apps/web/src/pages/deliverer/profile.tsx`

- [ ] **Step 1: Write profile.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { StatusBadge } from '../../components/deliverer/StatusBadge';
import { LogOut, Bike, CreditCard } from 'lucide-react';

export default function DelivererProfile() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getDelivererProfile(token).then(setProfile).catch(console.error);
  }, [token, router]);

  const handleLogout = () => {
    storage.clearTokens();
    localStorage.removeItem('user');
    router.push('/deliverer/login');
  };

  if (!profile) return <div className="p-4 text-[#999999]">Chargement...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4">Profil</h1>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6 text-center mb-4">
        <div className="w-20 h-20 bg-[#F5F0E8] rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-[#D84315]">
          {profile.firstName?.[0]}{profile.lastName?.[0]}
        </div>
        <p className="font-bold text-[#1A1A1A]">{profile.firstName} {profile.lastName}</p>
        <p className="text-[#666666] text-sm">{profile.phone}</p>
        <div className="mt-3">
          <StatusBadge status={profile.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 mb-4">
        <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><Bike className="w-5 h-5 text-[#D84315]" /> Véhicule</h2>
        <p className="text-[#666666] text-sm">Type: {profile.vehicleType}</p>
        {profile.vehiclePlate && <p className="text-[#666666] text-sm">Plaque: {profile.vehiclePlate}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 mb-4">
        <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#D84315]" /> Documents</h2>
        <div className="space-y-2">
          {profile.documents?.map((doc: any) => (
            <div key={doc.id} className="flex justify-between items-center">
              <span className="text-sm text-[#666666]">{doc.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${doc.status === 'APPROVED' ? 'bg-[#2E7D32] text-white' : 'bg-[#F9A825] text-white'}`}>
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-[#999999] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <LogOut className="w-5 h-5" /> Déconnexion
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/deliverer/profile.tsx
git commit -m "feat(web): add deliverer profile page"
```

---

## Phase 8: Integration & Final Checks

### Task 28: Build and Verify

- [ ] **Step 1: Build the API**

```bash
npm run build -w packages/api
```

Expected: Build completes without errors.

- [ ] **Step 2: Build the Web app**

```bash
npm run build -w apps/web
```

Expected: Build completes without errors.

- [ ] **Step 3: Commit any fixes**

If build errors are fixed, commit:

```bash
git add -A
git commit -m "fix: resolve build errors for deliverer app"
```

---

## Self-Review

### Spec Coverage
- [x] Prisma schema extensions — Task 1
- [x] Deliverers module (controller, service, DTOs) — Tasks 2–5
- [x] Users become-deliverer — Task 6
- [x] Admin deliverer management — Task 7
- [x] WebSocket events — Task 8
- [x] Frontend API client — Task 9
- [x] Auth redirect by role — Task 10
- [x] Layout & components — Tasks 11–17
- [x] Pages (login, register, dashboard, missions, detail, tracking, earnings, withdrawals, profile) — Tasks 18–27
- [x] Build verification — Task 28

### Placeholder Scan
- No TBD, TODO, or "implement later" found.
- All DTOs have complete decorators.
- All pages have complete JSX.

### Type Consistency
- `UserRole.DELIVERY_PERSON` used consistently.
- `OrderStatus` and `DeliveryStatus` enums used correctly.
- API method signatures match controller endpoints.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-14-delivery-person-app.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints

Which approach do you prefer?
