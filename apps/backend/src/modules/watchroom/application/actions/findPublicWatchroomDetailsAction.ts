import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export class FindPublicWatchroomDetailsAction {
  private readonly watchroomRepository: WatchroomRepository;

  public constructor(watchroomRepository: WatchroomRepository) {
    this.watchroomRepository = watchroomRepository;
  }

  public async execute(publicLinkId: string): Promise<Watchroom> {
    const watchroom = await this.watchroomRepository.findOne({ publicLinkId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: publicLinkId,
      });
    }

    return watchroom;
  }
}
