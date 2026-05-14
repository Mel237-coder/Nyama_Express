import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return { status: 'ok', service: 'FoodApp API', timestamp: new Date().toISOString() };
  }
}
