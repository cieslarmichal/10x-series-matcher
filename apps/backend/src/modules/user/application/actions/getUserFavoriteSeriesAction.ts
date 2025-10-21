import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { FavoriteSeries } from '../../domain/types/favoriteSeries.ts';

export class GetUserFavoriteSeriesAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;

  public constructor(favoriteSeriesRepository: FavoriteSeriesRepository) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
  }

  public async execute(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ favorites: FavoriteSeries[]; total: number }> {
    return this.favoriteSeriesRepository.findByUserId(userId, page, limit);
  }
}
