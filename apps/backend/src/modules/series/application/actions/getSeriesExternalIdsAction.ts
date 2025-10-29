import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { SeriesExternalIds } from '../../domain/types/series.ts';

export class GetSeriesExternalIdsAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(seriesTmdbId: number): Promise<SeriesExternalIds> {
    return this.tmdbService.getSeriesExternalIds(seriesTmdbId);
  }
}
