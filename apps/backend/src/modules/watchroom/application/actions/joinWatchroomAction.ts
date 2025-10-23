import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export interface JoinWatchroomActionPayload {
  readonly publicLinkId: string;
  readonly userId: string;
}

export class JoinWatchroomAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;

  public constructor(watchroomRepository: WatchroomRepository, loggerService: LoggerService) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: JoinWatchroomActionPayload): Promise<Watchroom> {
    const { publicLinkId, userId } = payload;

    this.loggerService.debug({
      message: 'Joining watchroom...',
      publicLinkId,
      userId,
    });

    const watchroom = await this.watchroomRepository.findOne({ publicLinkId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: publicLinkId,
      });
    }

    const isParticipant = await this.watchroomRepository.isParticipant({ watchroomId: watchroom.id, userId });

    if (isParticipant) {
      throw new ResourceAlreadyExistsError({
        resource: 'WatchroomParticipant',
        reason: 'User is already a participant of this watchroom',
        watchroomId: watchroom.id,
        userId,
      });
    }

    await this.watchroomRepository.addParticipant({ watchroomId: watchroom.id, userId });

    this.loggerService.info({
      message: 'Watchroom joined successfully.',
      watchroomId: watchroom.id,
      userId,
    });

    return watchroom;
  }
}
