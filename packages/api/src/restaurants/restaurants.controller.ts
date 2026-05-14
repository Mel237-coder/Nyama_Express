import { Controller, Get, Param, Query } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  @Get()
  async findAll() {
    return this.restaurantsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.restaurantsService.findById(id);
  }

  @Get(':id/categories')
  async getCategories(@Param('id') id: string) {
    return this.restaurantsService.getCategories(id);
  }

  @Get(':id/items')
  async getMenuItems(@Param('id') id: string, @Query('categoryId') categoryId?: string) {
    return this.restaurantsService.getMenuItems(id, categoryId);
  }
}
