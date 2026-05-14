import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('role') role?: UserRole,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll({
      role,
      status: status as any,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.usersService.getStats();
  }

  // ============================================
  // ADDRESSES (must come before :id routes)
  // ============================================

  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  async getAddresses(@CurrentUser() user: any) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  async addAddress(@CurrentUser() user: any, @Body() data: any) {
    return this.usersService.addAddress(user.id, data);
  }

  @Put('addresses/:id')
  @UseGuards(JwtAuthGuard)
  async updateAddress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.usersService.updateAddress(user.id, id, data);
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.id, id);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Patch('become-deliverer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async becomeDeliverer(@Request() req: any, @Body() data: {
    cniNumber: string;
    cniPhotoUrl: string;
    selfieUrl: string;
    vehicleType: string;
    vehiclePlate?: string;
    zoneId: string;
  }) {
    return this.usersService.becomeDeliverer(req.user.userId, data);
  }
}
