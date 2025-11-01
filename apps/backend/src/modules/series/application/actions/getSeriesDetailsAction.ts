import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeriesDetails } from '../../domain/types/tmdbSeries.ts';

export class GetSeriesDetailsAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(seriesTmdbId: number): Promise<TmdbSeriesDetails> {
    const details = await this.tmdbService.getSeriesDetails(seriesTmdbId);

    return details;
  }
}
