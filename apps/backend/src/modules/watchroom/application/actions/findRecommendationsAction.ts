import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Recommendation } from '../../domain/types/recommendation.ts';

export interface FindRecommendationsActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

export class FindRecommendationsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;

  public constructor(watchroomRepository: WatchroomRepository, recommendationRepository: RecommendationRepository) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
  }

  public async execute(payload: FindRecommendationsActionPayload): Promise<Recommendation[]> {
    const { watchroomId, userId } = payload;

    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    const isParticipant = await this.watchroomRepository.isParticipant(watchroomId, userId);

    if (!isParticipant) {
      throw new ForbiddenAccessError({
        reason: 'Only watchroom participants can view recommendations',
      });
    }

    const recommendations = await this.recommendationRepository.findByWatchroomId(watchroomId);

    return recommendations;
  }
}
