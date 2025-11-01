import type { FavoriteSeries } from '../types/favoriteSeries.ts';

export interface CreateFavoriteSeriesData {
  readonly userId: string;
  readonly seriesTmdbId: number;
}

export interface FavoriteSeriesRepository {
  create(favoriteSeriesData: CreateFavoriteSeriesData): Promise<FavoriteSeries>;
  findMany(userId: string, page: number, pageSize: number): Promise<FavoriteSeries[]>;
  count(userId: string): Promise<number>;
  findOne(userId: string, seriesTmdbId: number): Promise<FavoriteSeries | null>;
  delete(userId: string, seriesTmdbId: number): Promise<void>;
}
