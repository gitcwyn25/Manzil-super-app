import { Injectable, Logger } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService {
  private client: MeiliSearch;
  private logger = new Logger('SearchService');

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_KEY || 'test-key',
    });
  }

  async search(query: string, filters?: { category?: string; locale?: string }) {
    try {
      const results = await this.client.index('businesses').search(query, {
        filter: filters?.category ? [`category = ${filters.category}`] : [],
      });
      return results;
    } catch (error) {
      this.logger.error('Search error:', error);
      throw error;
    }
  }

  async indexBusiness(business: any) {
    try {
      await this.client.index('businesses').addDocuments([business]);
    } catch (error) {
      this.logger.error('Index error:', error);
    }
  }
}
