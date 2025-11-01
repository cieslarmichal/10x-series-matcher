import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeriesExternalIds } from '../../domain/types/tmdbSeries.ts';

export class GetSeriesExternalIdsAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(seriesTmdbId: number): Promise<TmdbSeriesExternalIds> {
    return this.tmdbService.getSeriesExternalIds(seriesTmdbId);
  }
}
