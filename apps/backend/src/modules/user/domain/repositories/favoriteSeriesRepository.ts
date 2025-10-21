import type { FavoriteSeries } from '../types/favoriteSeries.ts';

export interface CreateFavoriteSeriesData {
  readonly userId: string;
  readonly seriesTmdbId: number;
}

export interface FavoriteSeriesRepository {
  create(favoriteSeriesData: CreateFavoriteSeriesData): Promise<FavoriteSeries>;
  findByUserId(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    favorites: FavoriteSeries[];
    total: number;
  }>;
  findByUserIdAndSeriesTmdbId(userId: string, seriesTmdbId: number): Promise<FavoriteSeries | null>;
  delete(userId: string, seriesTmdbId: number): Promise<void>;
}
