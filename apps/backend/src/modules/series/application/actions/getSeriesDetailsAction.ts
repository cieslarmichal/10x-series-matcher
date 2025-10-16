import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { SeriesDetails } from '../../domain/types/series.ts';

export class GetSeriesDetailsAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(seriesTmdbId: number): Promise<SeriesDetails> {
    const details = await this.tmdbService.getSeriesDetails(seriesTmdbId);

    return details;
  }
}
