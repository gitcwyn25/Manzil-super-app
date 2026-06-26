import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('locale') locale: string = 'uz',
  ) {
    return this.searchService.search(query, { category, locale });
  }
}
