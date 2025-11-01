import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';

export class RemoveIgnoredSeriesAction {
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;

  public constructor(ignoredSeriesRepository: IgnoredSeriesRepository) {
    this.ignoredSeriesRepository = ignoredSeriesRepository;
  }

  public async execute(userId: string, seriesTmdbId: number): Promise<void> {
    const existing = await this.ignoredSeriesRepository.findOne(userId, seriesTmdbId);

    if (!existing) {
      throw new ResourceNotFoundError({
        resource: 'Ignored Series',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    await this.ignoredSeriesRepository.delete(userId, seriesTmdbId);
  }
}
