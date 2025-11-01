import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { users, userIgnoredSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { AddIgnoredSeriesAction } from './addIgnoredSeriesAction.ts';

describe('AddIgnoredSeriesAction', () => {
  let database: Database;
  let userRepository: UserRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let addIgnoredSeriesAction: AddIgnoredSeriesAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    database = new Database({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(database);
    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;
    addIgnoredSeriesAction = new AddIgnoredSeriesAction(ignoredSeriesRepository, loggerService);

    await database.db.delete(userIgnoredSeries);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userIgnoredSeries);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('adds a series to ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      const ignored = await addIgnoredSeriesAction.execute(user.id, seriesTmdbId);

      expect(ignored.userId).toBe(user.id);
      expect(ignored.seriesTmdbId).toBe(seriesTmdbId);
      expect(ignored.id).toBeDefined();
      expect(ignored.ignoredAt).toBeInstanceOf(Date);
    });

    it('throws ResourceAlreadyExistsError when series is already ignored', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId });

      await expect(addIgnoredSeriesAction.execute(user.id, seriesTmdbId)).rejects.toThrow(ResourceAlreadyExistsError);
    });
  });
});
