import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { FavoriteSeries } from '../../domain/types/favoriteSeries.ts';

export class AddFavoriteSeriesAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly loggerService: LoggerService;

  public constructor(favoriteSeriesRepository: FavoriteSeriesRepository, loggerService: LoggerService) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.loggerService = loggerService;
  }

  public async execute(userId: string, seriesTmdbId: number): Promise<FavoriteSeries> {
    const existing = await this.favoriteSeriesRepository.findOne(userId, seriesTmdbId);

    if (existing) {
      throw new ResourceAlreadyExistsError({
        resource: 'Favorite Series',
        reason: 'Series is already in favorites',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    const favoriteSeries = await this.favoriteSeriesRepository.create({ userId, seriesTmdbId });

    this.loggerService.info({
      message: 'Series added to favorites',
      userId,
      seriesTmdbId,
    });

    return favoriteSeries;
  }
}
