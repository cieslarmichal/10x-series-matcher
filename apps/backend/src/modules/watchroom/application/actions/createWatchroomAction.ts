import { customAlphabet } from 'nanoid';

import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);

export interface CreateWatchroomActionPayload {
  readonly name: string;
  readonly description?: string | undefined;
  readonly ownerId: string;
}

export class CreateWatchroomAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;

  public constructor(watchroomRepository: WatchroomRepository, loggerService: LoggerService) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: CreateWatchroomActionPayload): Promise<Watchroom> {
    const { name, description, ownerId } = payload;

    const publicLinkId = nanoid();

    this.loggerService.debug({
      message: 'Creating watchroom...',
      name,
      description,
      ownerId,
      publicLinkId,
    });

    const watchroom = await this.watchroomRepository.create({
      name,
      description,
      ownerId,
      publicLinkId,
    });

    this.loggerService.info({
      message: 'Watchroom created successfully.',
      watchroomId: watchroom.id,
      name: watchroom.name,
      description: watchroom.description,
      ownerId: watchroom.ownerId,
      publicLinkId: watchroom.publicLinkId,
    });

    return watchroom;
  }
}
