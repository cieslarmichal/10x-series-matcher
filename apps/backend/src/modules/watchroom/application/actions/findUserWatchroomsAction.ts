import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export interface FindUserWatchroomsActionPayload {
  readonly userId: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface FindUserWatchroomsActionResult {
  readonly data: Watchroom[];
  readonly total: number;
}

export class FindUserWatchroomsAction {
  private readonly watchroomRepository: WatchroomRepository;

  public constructor(watchroomRepository: WatchroomRepository) {
    this.watchroomRepository = watchroomRepository;
  }

  public async execute(payload: FindUserWatchroomsActionPayload): Promise<FindUserWatchroomsActionResult> {
    const { userId, page, pageSize } = payload;

    const [watchrooms, total] = await Promise.all([
      this.watchroomRepository.findMany(userId, page, pageSize),
      this.watchroomRepository.count(userId),
    ]);

    return { data: watchrooms, total };
  }
}
