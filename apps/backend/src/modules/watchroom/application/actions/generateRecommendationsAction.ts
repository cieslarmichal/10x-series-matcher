import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { OpenRouterService } from '../../../../common/openRouter/openRouterService.ts';
import type { ResponseFormat } from '../../../../common/openRouter/types.ts';
import type { FavoriteSeriesRepository } from '../../../user/domain/repositories/favoriteSeriesRepository.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Recommendation } from '../../domain/types/recommendation.ts';

export interface GenerateRecommendationsActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

interface AIRecommendation {
  readonly seriesTmdbId: number;
  readonly justification: string;
}

interface AIRecommendationsResponse {
  readonly recommendations: AIRecommendation[];
}

export class GenerateRecommendationsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly openRouterService: OpenRouterService;
  private readonly loggerService: LoggerService;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRepository: RecommendationRepository,
    favoriteSeriesRepository: FavoriteSeriesRepository,
    openRouterService: OpenRouterService,
    loggerService: LoggerService,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.openRouterService = openRouterService;
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

    // Fetch all participants' favorite series
    const participantIds = [watchroom.ownerId, ...watchroom.participants.map((p) => p.id)];

    this.loggerService.debug({
      message: 'Fetching favorite series for all participants',
      watchroomId,
      participantCount: participantIds.length,
    });

    const participantFavorites = await Promise.all(
      participantIds.map(async (participantId) => {
        const favorites = await this.favoriteSeriesRepository.findMany(participantId, 1, 100);
        return {
          participantId,
          seriesTmdbIds: favorites.map((f) => f.seriesTmdbId),
        };
      }),
    );

    // Generate AI recommendations
    const aiRecommendations = await this.generateAIRecommendations(participantFavorites, watchroom.name);

    this.loggerService.info({
      message: 'AI recommendations generated',
      watchroomId,
      recommendationCount: aiRecommendations.length,
    });

    // Delete old recommendations
    await this.recommendationRepository.deleteAllByWatchroomId(watchroomId);

    // Create new recommendations
    const recommendations = await Promise.all(
      aiRecommendations.map((rec) =>
        this.recommendationRepository.create({
          watchroomId,
          seriesTmdbId: rec.seriesTmdbId,
          justification: rec.justification,
        }),
      ),
    );

    this.loggerService.info({
      message: 'Recommendations saved successfully',
      watchroomId,
      count: recommendations.length,
    });

    return recommendations;
  }

  private async generateAIRecommendations(
    participantFavorites: Array<{ participantId: string; seriesTmdbIds: number[] }>,
    watchroomName: string,
  ): Promise<AIRecommendation[]> {
    const systemMessage = `You are a TV series recommendation expert. Your task is to recommend series that would appeal to a group watching together based on their individual favorite series.

Rules:
- Analyze the collective preferences from all participants
- Recommend 5-10 series that balance different tastes
- Don't recommend series that participants already have in their favorites
- Provide clear justification for each recommendation explaining why it fits the group
- Return only TMDB series IDs (numeric) and justifications
- Focus on series that can be enjoyed by groups`;

    const userMessage = this.buildPromptMessage(participantFavorites, watchroomName);

    const responseFormat: ResponseFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'recommendations_response',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  seriesTmdbId: {
                    type: 'number',
                    description: 'The TMDB ID of the recommended series',
                  },
                  justification: {
                    type: 'string',
                    description: 'Explanation of why this series fits the group',
                  },
                },
                required: ['seriesTmdbId', 'justification'],
                additionalProperties: false,
              },
            },
          },
          required: ['recommendations'],
          additionalProperties: false,
        },
      },
    };

    const response = await this.openRouterService.sendRequest<AIRecommendationsResponse>({
      userMessage,
      systemMessage,
      responseFormat,
    });

    return response.data.recommendations;
  }

  private buildPromptMessage(
    participantFavorites: Array<{ participantId: string; seriesTmdbIds: number[] }>,
    watchroomName: string,
  ): string {
    const participantsWithFavorites = participantFavorites.filter((p) => p.seriesTmdbIds.length > 0);

    let message = `Watch room: "${watchroomName}"\n\n`;
    message += `Participants and their favorite series (TMDB IDs):\n\n`;

    participantsWithFavorites.forEach((participant, index) => {
      message += `Participant ${(index + 1).toString()}:\n`;
      message += `- Favorite series TMDB IDs: ${participant.seriesTmdbIds.join(', ')}\n\n`;
    });

    if (participantsWithFavorites.length === 0) {
      message += 'No participants have added favorite series yet. Recommend popular, widely-appealing series.\n\n';
    }

    message += `Based on the above preferences, recommend 5-10 series (using TMDB IDs) that this group would enjoy watching together. `;
    message += `Exclude any series already in their favorites. Provide justification for each recommendation.`;

    return message;
  }
}
