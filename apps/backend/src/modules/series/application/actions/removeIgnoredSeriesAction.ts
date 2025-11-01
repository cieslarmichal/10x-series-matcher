import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';

export class RemoveIgnoredSeriesAction {
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;
  private readonly loggerService: LoggerService;

  public constructor(ignoredSeriesRepository: IgnoredSeriesRepository, loggerService: LoggerService) {
    this.ignoredSeriesRepository = ignoredSeriesRepository;
    this.loggerService = loggerService;
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

    this.loggerService.info({
      message: 'Series removed from ignored list',
      userId,
      seriesTmdbId,
    });
  }
}
