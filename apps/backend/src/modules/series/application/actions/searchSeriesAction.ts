import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeries } from '../../domain/types/tmdbSeries.ts';

export interface SearchSeriesActionPayload {
  readonly query: string;
  readonly page: number;
}

export interface SeriesSearchActionResult {
  readonly page: number;
  readonly results: TmdbSeries[];
  readonly totalPages: number;
  readonly totalResults: number;
}

export class SearchSeriesAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(input: SearchSeriesActionPayload): Promise<SeriesSearchActionResult> {
    const result = await this.tmdbService.searchSeries({
      query: input.query,
      page: input.page,
    });

    return result;
  }
}
