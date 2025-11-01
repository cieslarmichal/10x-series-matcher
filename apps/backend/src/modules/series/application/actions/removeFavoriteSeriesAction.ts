import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';

export class RemoveFavoriteSeriesAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly loggerService: LoggerService;

  public constructor(favoriteSeriesRepository: FavoriteSeriesRepository, loggerService: LoggerService) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.loggerService = loggerService;
  }

  public async execute(userId: string, seriesTmdbId: number): Promise<void> {
    const existing = await this.favoriteSeriesRepository.findOne(userId, seriesTmdbId);

    if (!existing) {
      throw new ResourceNotFoundError({
        resource: 'Favorite Series',
        reason: 'Series not found in favorites',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    await this.favoriteSeriesRepository.delete(userId, seriesTmdbId);

    this.loggerService.info({
      message: 'Series removed from favorites',
      userId,
      seriesTmdbId,
    });
  }
}
