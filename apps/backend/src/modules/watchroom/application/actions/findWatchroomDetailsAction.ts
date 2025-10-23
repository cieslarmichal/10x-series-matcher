import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export class FindWatchroomDetailsAction {
  private readonly watchroomRepository: WatchroomRepository;

  public constructor(watchroomRepository: WatchroomRepository) {
    this.watchroomRepository = watchroomRepository;
  }

  public async execute(watchroomId: string): Promise<Watchroom> {
    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    return watchroom;
  }
}
