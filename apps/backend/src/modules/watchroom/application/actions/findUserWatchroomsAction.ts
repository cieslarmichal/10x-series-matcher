import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export interface FindUserWatchroomsActionPayload {
  readonly userId: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface FindUserWatchroomsActionResult {
  readonly data: Watchroom[];
  readonly metadata: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export class FindUserWatchroomsAction {
  private readonly watchroomRepository: WatchroomRepository;

  public constructor(watchroomRepository: WatchroomRepository) {
    this.watchroomRepository = watchroomRepository;
  }

  public async execute(payload: FindUserWatchroomsActionPayload): Promise<FindUserWatchroomsActionResult> {
    const page = payload.page ?? 1;
    const pageSize = payload.pageSize ?? 20;

    const { watchrooms, total } = await this.watchroomRepository.findMany({
      ownerId: payload.userId,
      page,
      limit: pageSize,
    });

    return {
      data: watchrooms,
      metadata: {
        page,
        pageSize,
        total,
      },
    };
  }
}
