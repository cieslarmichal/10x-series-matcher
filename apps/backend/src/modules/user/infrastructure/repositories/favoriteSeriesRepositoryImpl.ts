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

  public async count(userId: string): Promise<number> {
    const [countResult] = await this.database.db
      .select({ count: this.database.db.$count(userFavoriteSeries) })
      .from(userFavoriteSeries)
      .where(eq(userFavoriteSeries.userId, userId));

    return countResult?.count ?? 0;
  }

  public async findMany(userId: string, page: number, pageSize: number): Promise<FavoriteSeries[]> {
    const favorites = await this.database.db
      .select()
      .from(userFavoriteSeries)
      .where(eq(userFavoriteSeries.userId, userId))
      .orderBy(desc(userFavoriteSeries.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return favorites.map(this.mapToFavoriteSeries);
  }

  public async findOne(userId: string, seriesTmdbId: number): Promise<FavoriteSeries | null> {
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
