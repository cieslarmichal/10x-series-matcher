import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';
import type { IgnoredSeries } from '../../domain/types/ignoredSeries.ts';

export class AddIgnoredSeriesAction {
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;
  private readonly loggerService: LoggerService;

  public constructor(ignoredSeriesRepository: IgnoredSeriesRepository, loggerService: LoggerService) {
    this.ignoredSeriesRepository = ignoredSeriesRepository;
    this.loggerService = loggerService;
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

    const ignoredSeries = await this.ignoredSeriesRepository.create({ userId, seriesTmdbId });

    this.loggerService.info({
      message: 'Series added to ignored list',
      userId,
      seriesTmdbId,
    });

    return ignoredSeries;
  }
}
