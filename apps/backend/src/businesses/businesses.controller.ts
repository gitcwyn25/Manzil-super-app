import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('businesses')
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
  ) {
    return this.businessesService.findAll({ category, latitude, longitude });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('locale') locale = 'uz') {
    return this.businessesService.findOne(id, locale);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: any) {
    return this.businessesService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.businessesService.update(id, data);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  async claimBusiness(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.businessesService.claimBusiness(id, body.userId);
  }
}
