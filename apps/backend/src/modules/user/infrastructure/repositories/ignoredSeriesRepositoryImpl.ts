import { eq, and, desc, count } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { userIgnoredSeries } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateIgnoredSeriesData,
  IgnoredSeriesRepository,
} from '../../domain/repositories/ignoredSeriesRepository.ts';
import type { IgnoredSeries } from '../../domain/types/ignoredSeries.ts';

export class IgnoredSeriesRepositoryImpl implements IgnoredSeriesRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async create(ignoredSeriesData: CreateIgnoredSeriesData): Promise<IgnoredSeries> {
    const [newIgnored] = await this.database.db
      .insert(userIgnoredSeries)
      .values({
        id: UuidService.generateUuid(),
        userId: ignoredSeriesData.userId,
        seriesTmdbId: ignoredSeriesData.seriesTmdbId,
      })
      .returning();

    if (!newIgnored) {
      throw new Error('Failed to create ignored series');
    }

    return this.mapToIgnoredSeries(newIgnored);
  }

  public async count(userId: string): Promise<number> {
    const [countResult] = await this.database.db
      .select({ count: count() })
      .from(userIgnoredSeries)
      .where(eq(userIgnoredSeries.userId, userId));

    return countResult?.count ?? 0;
  }

  public async findMany(userId: string, page: number, pageSize: number): Promise<IgnoredSeries[]> {
    const ignored = await this.database.db
      .select()
      .from(userIgnoredSeries)
      .where(eq(userIgnoredSeries.userId, userId))
      .orderBy(desc(userIgnoredSeries.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return ignored.map(this.mapToIgnoredSeries);
  }

  public async findOne(userId: string, seriesTmdbId: number): Promise<IgnoredSeries | null> {
    const [ignored] = await this.database.db
      .select()
      .from(userIgnoredSeries)
      .where(and(eq(userIgnoredSeries.userId, userId), eq(userIgnoredSeries.seriesTmdbId, seriesTmdbId)))
      .limit(1);

    return ignored ? this.mapToIgnoredSeries(ignored) : null;
  }

  public async delete(userId: string, seriesTmdbId: number): Promise<void> {
    await this.database.db
      .delete(userIgnoredSeries)
      .where(and(eq(userIgnoredSeries.userId, userId), eq(userIgnoredSeries.seriesTmdbId, seriesTmdbId)));
  }

  private readonly mapToIgnoredSeries = (dbIgnored: typeof userIgnoredSeries.$inferSelect): IgnoredSeries => {
    const ignored: IgnoredSeries = {
      id: dbIgnored.id,
      userId: dbIgnored.userId,
      seriesTmdbId: dbIgnored.seriesTmdbId,
      ignoredAt: dbIgnored.ignoredAt,
    };

    return ignored;
  };
}
