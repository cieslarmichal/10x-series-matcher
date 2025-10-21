import { eq, and, desc } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateFavoriteSeriesData,
  FavoriteSeriesRepository,
} from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { FavoriteSeries } from '../../domain/types/favoriteSeries.ts';

export class FavoriteSeriesRepositoryImpl implements FavoriteSeriesRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async create(favoriteSeriesData: CreateFavoriteSeriesData): Promise<FavoriteSeries> {
    const [newFavorite] = await this.database.db
      .insert(userFavoriteSeries)
      .values({
        id: UuidService.generateUuid(),
        userId: favoriteSeriesData.userId,
        seriesTmdbId: favoriteSeriesData.seriesTmdbId,
      })
      .returning();

    if (!newFavorite) {
      throw new Error('Failed to create favorite series');
    }

    return this.mapToFavoriteSeries(newFavorite);
  }

  public async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ favorites: FavoriteSeries[]; total: number }> {
    const offset = (page - 1) * limit;

    const [countResult] = await this.database.db
      .select({ count: this.database.db.$count(userFavoriteSeries) })
      .from(userFavoriteSeries)
      .where(eq(userFavoriteSeries.userId, userId));

    const total = countResult?.count ?? 0;

    const favorites = await this.database.db
      .select()
      .from(userFavoriteSeries)
      .where(eq(userFavoriteSeries.userId, userId))
      .orderBy(desc(userFavoriteSeries.id))
      .limit(limit)
      .offset(offset);

    return {
      favorites: favorites.map(this.mapToFavoriteSeries),
      total,
    };
  }

  public async findByUserIdAndSeriesTmdbId(userId: string, seriesTmdbId: number): Promise<FavoriteSeries | null> {
    const [favorite] = await this.database.db
      .select()
      .from(userFavoriteSeries)
      .where(and(eq(userFavoriteSeries.userId, userId), eq(userFavoriteSeries.seriesTmdbId, seriesTmdbId)))
      .limit(1);

    return favorite ? this.mapToFavoriteSeries(favorite) : null;
  }

  public async delete(userId: string, seriesTmdbId: number): Promise<void> {
    await this.database.db
      .delete(userFavoriteSeries)
      .where(and(eq(userFavoriteSeries.userId, userId), eq(userFavoriteSeries.seriesTmdbId, seriesTmdbId)));
  }

  private readonly mapToFavoriteSeries = (dbFavorite: typeof userFavoriteSeries.$inferSelect): FavoriteSeries => {
    const favorite: FavoriteSeries = {
      id: dbFavorite.id,
      userId: dbFavorite.userId,
      seriesTmdbId: dbFavorite.seriesTmdbId,
      addedAt: dbFavorite.addedAt,
    };

    return favorite;
  };
}
