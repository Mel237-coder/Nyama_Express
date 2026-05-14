import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: any, @Req() req: any) {
    return this.ordersService.create(data, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (user.role === UserRole.ADMIN) {
      return this.ordersService.findAllAdmin(pageNum, limitNum);
    }
    return this.ordersService.findAllByClient(user.userId, pageNum, limitNum);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.ordersService.findAllAdmin(pageNum, limitNum);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.findById(id, req.user.userId, req.user.role);
  }

  @Get(':id/tracking')
  @UseGuards(JwtAuthGuard)
  getTracking(@Param('id') orderId: string) {
    return this.ordersService.getTracking(orderId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT_OWNER, UserRole.DELIVERY_PERSON)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status as OrderStatus);
  }

  @Post(':id/confirm-delivery')
  @UseGuards(JwtAuthGuard)
  confirmDelivery(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.confirmDelivery(id);
  }
}
