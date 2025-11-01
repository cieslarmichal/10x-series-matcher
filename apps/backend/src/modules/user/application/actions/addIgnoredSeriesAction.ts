import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';
import type { IgnoredSeries } from '../../domain/types/ignoredSeries.ts';

export class AddIgnoredSeriesAction {
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;

  public constructor(ignoredSeriesRepository: IgnoredSeriesRepository) {
    this.ignoredSeriesRepository = ignoredSeriesRepository;
  }

  public async execute(userId: string, seriesTmdbId: number): Promise<IgnoredSeries> {
    const existing = await this.ignoredSeriesRepository.findOne(userId, seriesTmdbId);

    if (existing) {
      throw new ResourceAlreadyExistsError({
        resource: 'Ignored Series',
        reason: 'Series is already in ignored list',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    return this.ignoredSeriesRepository.create({ userId, seriesTmdbId });
  }
}
