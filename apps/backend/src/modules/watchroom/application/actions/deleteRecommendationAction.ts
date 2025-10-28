import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

export interface DeleteRecommendationActionPayload {
  readonly recommendationId: string;
  readonly watchroomId: string;
  readonly userId: string;
}

export class DeleteRecommendationAction {
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

  public async execute(payload: DeleteRecommendationActionPayload): Promise<void> {
    const { recommendationId, watchroomId, userId } = payload;

    this.loggerService.debug({
      message: 'Deleting recommendation...',
      recommendationId,
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
        reason: 'Only the watchroom owner can delete recommendations',
      });
    }

    const recommendation = await this.recommendationRepository.findOne(recommendationId);

    if (!recommendation) {
      throw new ResourceNotFoundError({
        resource: 'Recommendation',
        id: recommendationId,
      });
    }

    if (recommendation.watchroomId !== watchroomId) {
      throw new ForbiddenAccessError({
        reason: 'Recommendation does not belong to this watchroom',
      });
    }

    await this.recommendationRepository.delete(recommendationId);

    this.loggerService.info({
      message: 'Recommendation deleted successfully.',
      recommendationId,
      watchroomId,
      userId,
    });
  }
}
