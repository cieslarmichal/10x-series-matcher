import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { createConfig } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { users, userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';

import { AddFavoriteSeriesAction } from './addFavoriteSeriesAction.ts';

describe('AddFavoriteSeriesAction', () => {
  let database: Database;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let addFavoriteSeriesAction: AddFavoriteSeriesAction;

  beforeEach(async () => {
    const config = createConfig();
    database = new Database({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(database);

    addFavoriteSeriesAction = new AddFavoriteSeriesAction(favoriteSeriesRepository);

    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('adds a favorite series successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const result = await addFavoriteSeriesAction.execute(user.id, seriesTmdbId);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.addedAt).toBeDefined();
    });

    it('throws ResourceAlreadyExistsError when series is already in favorites', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId });

      await expect(addFavoriteSeriesAction.execute(user.id, seriesTmdbId)).rejects.toThrow(ResourceAlreadyExistsError);
    });
  });
});
