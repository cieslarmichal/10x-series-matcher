import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export class FindUserWatchroomsAction {
  private readonly watchroomRepository: WatchroomRepository;

  public constructor(watchroomRepository: WatchroomRepository) {
    this.watchroomRepository = watchroomRepository;
  }

  public async execute(userId: string): Promise<Watchroom[]> {
    const watchrooms = await this.watchroomRepository.findMany({ ownerId: userId });

    return watchrooms;
  }
}
