import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Recommendation } from '../../domain/types/recommendation.ts';

export interface GenerateRecommendationsActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

export class GenerateRecommendationsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;
  private readonly loggerService: LoggerService;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRepository: RecommendationRepository,
    loggerService: LoggerService,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: GenerateRecommendationsActionPayload): Promise<Recommendation[]> {
    const { watchroomId, userId } = payload;

    this.loggerService.debug({
      message: 'Generating recommendations for watchroom...',
      watchroomId,
      userId,
    });

    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    if (watchroom.ownerId !== userId) {
      throw new ForbiddenAccessError({
        reason: 'Only the watchroom owner can generate recommendations',
      });
    }

    // TODO: Implement AI integration to generate recommendations
    // 1. Fetch all participants' favorite series from userFavoriteSeriesRepository
    // 2. Send aggregated data to OpenAI API
    // 3. Parse AI response to extract recommendations
    // 4. Delete old recommendations: await this.recommendationRepository.deleteAllByWatchroomId(watchroomId)
    // 5. Create new recommendations: await this.recommendationRepository.create({ watchroomId, seriesTmdbId, justification })

    this.loggerService.info({
      message: 'Recommendations will be generated using AI (not yet implemented).',
      watchroomId,
      userId,
    });

    // Placeholder: return empty array for now
    return [];
  }
}
