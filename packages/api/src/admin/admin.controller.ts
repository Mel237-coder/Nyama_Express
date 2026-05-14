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

  @Get('dashboard') @Roles(UserRole.ADMIN) async getDashboardStats() { return this.adminService.getDashboardStats(); }
  @Get('activity') @Roles(UserRole.ADMIN) async getRecentActivity() { return this.adminService.getRecentActivity(); }
  @Get('deliverers/pending') @Roles(UserRole.ADMIN) async getPendingDeliverers() { return this.adminService.getPendingDeliverers(); }
  @Get('deliverers') @Roles(UserRole.ADMIN) async getAllDeliverers() { return this.adminService.getAllDeliverers(); }
  @Patch('deliverers/:id/approve') @Roles(UserRole.ADMIN) async approveDeliverer(@Param('id') id: string) { return this.adminService.approveDeliverer(id); }
  @Patch('deliverers/:id/reject') @Roles(UserRole.ADMIN) async rejectDeliverer(@Param('id') id: string, @Body('reason') reason?: string) { return this.adminService.rejectDeliverer(id, reason); }
}
