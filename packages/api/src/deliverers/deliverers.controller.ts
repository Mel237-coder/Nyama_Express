import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
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

  @Post('register') async register(@Body() dto: RegisterDelivererDto) { return this.deliverersService.register(dto); }

  @Get('status') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async getStatus(@Request() req) { return this.deliverersService.getStatus(req.user.userId); }

  @Patch('status') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async updateStatus(@Request() req, @Body() dto: UpdateDelivererStatusDto) { return this.deliverersService.updateStatus(req.user.userId, dto); }

  @Post('online') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async setOnline(@Request() req) { return this.deliverersService.setOnline(req.user.userId, true); }

  @Post('offline') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async setOffline(@Request() req) { return this.deliverersService.setOnline(req.user.userId, false); }

  @Post('location') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async updateLocation(@Request() req, @Body() dto: UpdateLocationDto) { return this.deliverersService.updateLocation(req.user.userId, dto); }

  @Get('missions') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async getMissions(@Request() req, @Query('status') status?: string) { return this.deliverersService.getMissions(req.user.userId, status); }

  @Post('missions/:id/accept') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async acceptMission(@Request() req, @Param('id') orderId: string) { return this.deliverersService.acceptMission(req.user.userId, orderId); }

  @Patch('missions/:id/status') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async updateMissionStatus(@Request() req, @Param('id') orderId: string, @Body('status') status: any) { return this.deliverersService.updateMissionStatus(req.user.userId, orderId, status); }

  @Get('earnings') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async getEarnings(@Request() req) { return this.deliverersService.getEarnings(req.user.userId); }

  @Get('withdrawals') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async getWithdrawals(@Request() req) { return this.deliverersService.getWithdrawals(req.user.userId); }

  @Post('withdrawals') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async createWithdrawal(@Request() req, @Body() dto: CreateWithdrawalDto) { return this.deliverersService.createWithdrawal(req.user.userId, dto); }

  @Get('profile') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async getProfile(@Request() req) { return this.deliverersService.getProfile(req.user.userId); }

  @Patch('profile') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.DELIVERY_PERSON) @ApiBearerAuth()
  async updateProfile(@Request() req, @Body() data: any) { return this.deliverersService.updateProfile(req.user.userId, data); }
}
