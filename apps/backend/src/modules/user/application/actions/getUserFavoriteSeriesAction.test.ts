import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createConfig } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { users, userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';

import { GetUserFavoriteSeriesAction } from './getUserFavoriteSeriesAction.ts';

describe('GetUserFavoriteSeriesAction', () => {
  let database: Database;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let getUserFavoriteSeriesAction: GetUserFavoriteSeriesAction;

  beforeEach(async () => {
    const config = createConfig();
    database = new Database({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(database);

    getUserFavoriteSeriesAction = new GetUserFavoriteSeriesAction(favoriteSeriesRepository);

    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('returns user favorite series with pagination', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId1 = Generator.number(1, 10000);
      const seriesTmdbId2 = Generator.number(10001, 20000);

      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId1 });
      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId2 });

      const result = await getUserFavoriteSeriesAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]?.userId).toBe(user.id);
    });

    it('returns empty array when user has no favorite series', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const result = await getUserFavoriteSeriesAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
