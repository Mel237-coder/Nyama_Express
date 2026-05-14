import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.restaurant.findMany({
      where: { isActive: true },
      include: { categories: true },
    });
  }

  async findById(id: string) {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: { categories: { include: { items: true } }, documents: true },
    });
  }

  async getCategories(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getMenuItems(restaurantId: string, categoryId?: string) {
    if (categoryId) {
      return this.prisma.menuItem.findMany({
        where: { categoryId },
        orderBy: { name: 'asc' },
      });
    }
    const categories = await this.prisma.category.findMany({
      where: { restaurantId },
      select: { id: true },
    });
    const categoryIds = categories.map((c) => c.id);
    return this.prisma.menuItem.findMany({
      where: { categoryId: { in: categoryIds } },
      orderBy: { name: 'asc' },
    });
  }
}
