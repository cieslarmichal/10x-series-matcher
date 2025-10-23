import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { users, watchrooms, watchroomParticipants } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../infrastructure/repositories/watchroomRepositoryImpl.ts';

import { CreateWatchroomAction } from './createWatchroomAction.ts';
import { JoinWatchroomAction } from './joinWatchroomAction.ts';

describe('JoinWatchroomAction', () => {
  let database: Database;
  let watchroomRepository: WatchroomRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let createWatchroomAction: CreateWatchroomAction;
  let joinWatchroomAction: JoinWatchroomAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    database = new Database({ url: config.database.url });
    watchroomRepository = new WatchroomRepositoryImpl(database);
    userRepository = new UserRepositoryImpl(database);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    createWatchroomAction = new CreateWatchroomAction(watchroomRepository, loggerService);
    joinWatchroomAction = new JoinWatchroomAction(watchroomRepository, loggerService);

    await database.db.delete(watchroomParticipants);
    await database.db.delete(watchrooms);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(watchroomParticipants);
    await database.db.delete(watchrooms);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('joins a watchroom successfully', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroom = await createWatchroomAction.execute({
        name: Generator.words(3),
        description: Generator.sentences(2),
        ownerId: owner.id,
      });

      const result = await joinWatchroomAction.execute({
        publicLinkId: watchroom.publicLinkId,
        userId: participant.id,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(watchroom.id);
      expect(result.name).toBe(watchroom.name);

      const isParticipant = await watchroomRepository.isParticipant(watchroom.id, participant.id);
      expect(isParticipant).toBe(true);
    });

    it('adds participant to watchroom participants list', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroom = await createWatchroomAction.execute({
        name: Generator.words(3),
        ownerId: owner.id,
      });

      await joinWatchroomAction.execute({
        publicLinkId: watchroom.publicLinkId,
        userId: participant.id,
      });

      const updatedWatchroom = await watchroomRepository.findOne({ id: watchroom.id });

      expect(updatedWatchroom).toBeDefined();
      if (!updatedWatchroom) {
        throw new Error('Watchroom not found');
      }
      expect(updatedWatchroom.participants).toHaveLength(2);
      expect(updatedWatchroom.participants.some((p) => p.id === participant.id)).toBe(true);
      expect(updatedWatchroom.participants.some((p) => p.id === owner.id)).toBe(true);
    });

    it('throws ResourceNotFoundError when watchroom does not exist', async () => {
      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const nonExistentPublicLinkId = Generator.alphaString(10);

      await expect(
        joinWatchroomAction.execute({
          publicLinkId: nonExistentPublicLinkId,
          userId: participant.id,
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ResourceAlreadyExistsError when user is already a participant', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroom = await createWatchroomAction.execute({
        name: Generator.words(3),
        ownerId: owner.id,
      });

      await joinWatchroomAction.execute({
        publicLinkId: watchroom.publicLinkId,
        userId: participant.id,
      });

      await expect(
        joinWatchroomAction.execute({
          publicLinkId: watchroom.publicLinkId,
          userId: participant.id,
        }),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('throws ResourceAlreadyExistsError when owner tries to join their own watchroom', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const watchroom = await createWatchroomAction.execute({
        name: Generator.words(3),
        ownerId: owner.id,
      });

      await expect(
        joinWatchroomAction.execute({
          publicLinkId: watchroom.publicLinkId,
          userId: owner.id,
        }),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });
  });
});
