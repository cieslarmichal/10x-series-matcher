import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export interface FindWatchroomDetailsActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

export class FindWatchroomDetailsAction {
  private readonly watchroomRepository: WatchroomRepository;

  public constructor(watchroomRepository: WatchroomRepository) {
    this.watchroomRepository = watchroomRepository;
  }

  public async execute(payload: FindWatchroomDetailsActionPayload): Promise<Watchroom> {
    const { watchroomId, userId } = payload;

    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    const isParticipant = await this.watchroomRepository.isParticipant(watchroom.id, userId);

    if (!isParticipant) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    return watchroom;
  }
}
