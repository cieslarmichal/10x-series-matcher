import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { FavoriteSeries } from '../../domain/types/favoriteSeries.ts';

export class AddFavoriteSeriesAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;

  public constructor(favoriteSeriesRepository: FavoriteSeriesRepository) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
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

    return this.favoriteSeriesRepository.create({ userId, seriesTmdbId });
  }
}
