import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';
import type { IgnoredSeries } from '../../domain/types/ignoredSeries.ts';

export interface GetIgnoredSeriesActionPayload {
  readonly userId: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface GetIgnoredSeriesActionResult {
  readonly data: IgnoredSeries[];
  readonly total: number;
}

export class GetIgnoredSeriesAction {
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;

  public constructor(ignoredSeriesRepository: IgnoredSeriesRepository) {
    this.ignoredSeriesRepository = ignoredSeriesRepository;
  }

  public async execute(payload: GetIgnoredSeriesActionPayload): Promise<GetIgnoredSeriesActionResult> {
    const [data, total] = await Promise.all([
      this.ignoredSeriesRepository.findMany(payload.userId, payload.page, payload.pageSize),
      this.ignoredSeriesRepository.count(payload.userId),
    ]);

    return { data, total };
  }
}
