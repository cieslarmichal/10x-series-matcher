import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';

export class RemoveFavoriteSeriesAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;

  public constructor(favoriteSeriesRepository: FavoriteSeriesRepository) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
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
  }
}
