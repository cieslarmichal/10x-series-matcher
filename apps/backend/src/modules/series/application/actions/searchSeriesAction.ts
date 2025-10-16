import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { SeriesSearchResult } from '../../domain/types/series.ts';

export interface SearchSeriesInput {
  readonly query: string;
  readonly page: number;
}

export class SearchSeriesAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(input: SearchSeriesInput): Promise<SeriesSearchResult> {
    const result = await this.tmdbService.searchSeries({
      query: input.query,
      page: input.page,
    });

    return result;
  }
}
