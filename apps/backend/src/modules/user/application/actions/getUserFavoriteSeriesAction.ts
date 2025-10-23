import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { FavoriteSeries } from '../../domain/types/favoriteSeries.ts';

export interface GetUserFavoriteSeriesPayload {
  readonly userId: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface GetUserFavoriteSeriesResult {
  readonly data: FavoriteSeries[];
  readonly total: number;
}

export class GetUserFavoriteSeriesAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;

  public constructor(favoriteSeriesRepository: FavoriteSeriesRepository) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
  }

  public async execute(payload: GetUserFavoriteSeriesPayload): Promise<GetUserFavoriteSeriesResult> {
    const { userId, page, pageSize } = payload;

    const [favorites, total] = await Promise.all([
      this.favoriteSeriesRepository.findMany(userId, page, pageSize),
      this.favoriteSeriesRepository.count(userId),
    ]);

    return {
      data: favorites,
      total,
    };
  }
}
