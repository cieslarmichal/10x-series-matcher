import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { OpenRouterService } from '../../../../common/openRouter/openRouterService.ts';
import type { ResponseFormat } from '../../../../common/openRouter/types.ts';
import type { TmdbService } from '../../../series/domain/services/tmdbService.ts';
import type { FavoriteSeriesRepository } from '../../../user/domain/repositories/favoriteSeriesRepository.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

export interface GenerateRecommendationsActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
  readonly requestId: string;
}

export interface GenerateRecommendationsActionResult {
  readonly requestId: string;
}

interface AIRecommendation {
  readonly seriesName: string;
  readonly justification: string;
}

interface AIRecommendationsResponse {
  readonly recommendations: AIRecommendation[];
}

interface SeriesInfo {
  readonly tmdbId: number;
  readonly name: string;
  readonly overview: string;
  readonly genres: string[];
  readonly voteAverage: number;
  readonly firstAirDate: string | null;
}

const recommendationsResponseFormat: ResponseFormat = {
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
              seriesName: {
                type: 'string',
                description: 'The name of the recommended series',
              },
              justification: {
                type: 'string',
                description: 'Explanation of why this series fits the group',
              },
            },
            required: ['seriesName', 'justification'],
            additionalProperties: false,
          },
        },
      },
      required: ['recommendations'],
      additionalProperties: false,
    },
  },
} as const;

const systemMessage = `You are an expert TV series recommender AI.
Your task is to suggest TV series that a group of people would enjoy watching together based on their favorite series. Consider genres, themes, and styles that align with the group's collective tastes.
 Provide clear and concise justifications for each recommendation.`;

export class GenerateRecommendationsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly tmdbService: TmdbService;
  private readonly openRouterService: OpenRouterService;
  private readonly loggerService: LoggerService;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRepository: RecommendationRepository,
    favoriteSeriesRepository: FavoriteSeriesRepository,
    tmdbService: TmdbService,
    openRouterService: OpenRouterService,
    loggerService: LoggerService,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.tmdbService = tmdbService;
    this.openRouterService = openRouterService;
    this.loggerService = loggerService;
  }

  public async execute(payload: GenerateRecommendationsActionPayload): Promise<GenerateRecommendationsActionResult> {
    const { watchroomId, userId, requestId } = payload;

    this.loggerService.debug({
      message: 'Generating recommendations for watchroom...',
      watchroomId,
      userId,
      requestId,
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

    // Fetch series details from TMDB to provide context to the LLM
    const allSeriesIds = [...new Set(participantFavorites.flatMap((p) => p.seriesTmdbIds))];

    this.loggerService.debug({
      message: 'Fetching series details from TMDB',
      watchroomId,
      seriesCount: allSeriesIds.length,
    });

    const seriesInfoMap = await this.fetchSeriesInfo(allSeriesIds);

    this.loggerService.debug({
      message: 'Series details fetched successfully',
      watchroomId,
      fetchedCount: seriesInfoMap.size,
      failedCount: allSeriesIds.length - seriesInfoMap.size,
    });

    // Generate AI recommendations with enriched series information
    const aiRecommendations = await this.generateAIRecommendations(
      participantFavorites,
      seriesInfoMap,
      watchroom.name,
      watchroom.description,
    );

    this.loggerService.info({
      message: 'AI recommendations generated',
      watchroomId,
      recommendationCount: aiRecommendations.length,
    });

    // Resolve series names to TMDB IDs by searching TMDB
    const resolvedRecommendations = await this.resolveSeriesNames(aiRecommendations, allSeriesIds);

    this.loggerService.info({
      message: 'Series names resolved to TMDB IDs',
      watchroomId,
      originalCount: aiRecommendations.length,
      resolvedCount: resolvedRecommendations.length,
      failedCount: aiRecommendations.length - resolvedRecommendations.length,
    });

    // Delete old recommendations
    await this.recommendationRepository.deleteAllByWatchroomId(watchroomId);

    // Create new recommendations
    const recommendations = await Promise.all(
      resolvedRecommendations.map((rec) =>
        this.recommendationRepository.create({
          watchroomId,
          requestId,
          seriesTmdbId: rec.seriesTmdbId,
          justification: rec.justification,
        }),
      ),
    );

    this.loggerService.info({
      message: 'Recommendations saved successfully',
      watchroomId,
      requestId,
      count: recommendations.length,
    });

    return { requestId };
  }

  private async fetchSeriesInfo(seriesIds: number[]): Promise<Map<number, SeriesInfo>> {
    const seriesInfoMap = new Map<number, SeriesInfo>();

    // Fetch details in parallel with error handling per series
    await Promise.allSettled(
      seriesIds.map(async (tmdbId) => {
        try {
          const details = await this.tmdbService.getSeriesDetails(tmdbId);
          seriesInfoMap.set(tmdbId, {
            tmdbId,
            name: details.name,
            overview: details.overview,
            genres: details.genres,
            voteAverage: details.voteAverage,
            firstAirDate: details.firstAirDate,
          });
        } catch (error) {
          // Log but don't fail - some series might not be found
          this.loggerService.warn({
            message: 'Failed to fetch series details from TMDB',
            tmdbId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );

    return seriesInfoMap;
  }

  private async resolveSeriesNames(
    recommendations: AIRecommendation[],
    favoritesSeriesIds: number[],
  ): Promise<Array<{ seriesTmdbId: number; justification: string }>> {
    const resolvedRecommendations: Array<{ seriesTmdbId: number; justification: string }> = [];

    for (const recommendation of recommendations) {
      try {
        // Search TMDB for the series name
        this.loggerService.debug({
          message: 'Searching TMDB for series',
          seriesName: recommendation.seriesName,
        });

        const searchResult = await this.tmdbService.searchSeries({
          query: recommendation.seriesName,
          page: 1,
        });

        if (searchResult.results.length === 0) {
          this.loggerService.warn({
            message: 'No TMDB results found for series name',
            seriesName: recommendation.seriesName,
          });
          continue;
        }

        // Take the first (most relevant) result
        const firstResult = searchResult.results[0];

        if (!firstResult) {
          continue;
        }

        // Filter out series that are already in favorites
        if (favoritesSeriesIds.includes(firstResult.id)) {
          this.loggerService.debug({
            message: 'Filtering out recommendation already in favorites',
            seriesName: recommendation.seriesName,
            seriesTmdbId: firstResult.id,
          });
          continue;
        }

        resolvedRecommendations.push({
          seriesTmdbId: firstResult.id,
          justification: recommendation.justification,
        });

        this.loggerService.debug({
          message: 'Series name resolved to TMDB ID',
          seriesName: recommendation.seriesName,
          resolvedName: firstResult.name,
          seriesTmdbId: firstResult.id,
        });
      } catch (error) {
        this.loggerService.warn({
          message: 'Failed to resolve series name to TMDB ID',
          seriesName: recommendation.seriesName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return resolvedRecommendations;
  }

  private async generateAIRecommendations(
    participantFavorites: Array<{ participantId: string; seriesTmdbIds: number[] }>,
    seriesInfoMap: Map<number, SeriesInfo>,
    watchroomName: string,
    watchroomDescription: string | undefined,
  ): Promise<AIRecommendation[]> {
    const userMessage = this.buildPromptMessage(
      participantFavorites,
      seriesInfoMap,
      watchroomName,
      watchroomDescription,
    );

    const response = await this.openRouterService.sendRequest<AIRecommendationsResponse>({
      userMessage,
      systemMessage,
      responseFormat: recommendationsResponseFormat,
    });

    this.loggerService.debug({
      message: 'AI recommendations response received',
      recommendations: response.data.recommendations,
    });

    return response.data.recommendations;
  }

  private buildPromptMessage(
    participantFavorites: Array<{ participantId: string; seriesTmdbIds: number[] }>,
    seriesInfoMap: Map<number, SeriesInfo>,
    watchroomName: string,
    watchroomDescription: string | undefined,
  ): string {
    const participantsWithFavorites = participantFavorites.filter((p) => p.seriesTmdbIds.length > 0);

    let message = `Watch room: "${watchroomName}"\n`;
    if (watchroomDescription) {
      message += `Description: ${watchroomDescription}\n`;
    }
    message += `\nParticipants and their favorite series:\n\n`;

    participantsWithFavorites.forEach((participant, index) => {
      message += `Participant ${(index + 1).toString()}:\n`;
      participant.seriesTmdbIds.forEach((tmdbId) => {
        const seriesInfo = seriesInfoMap.get(tmdbId);
        if (seriesInfo) {
          message += `- ${seriesInfo.name}\n`;
          message += `  Genres: ${seriesInfo.genres.join(', ')}\n`;
          message += `  Overview: ${seriesInfo.overview.substring(0, 150)}${seriesInfo.overview.length > 150 ? '...' : ''}\n`;
          message += `  Rating: ${seriesInfo.voteAverage.toFixed(1)}/10\n`;
        }
      });
      message += '\n';
    });

    // Collect all favorite series names to show in the prompt
    const allFavoriteNames = Array.from(seriesInfoMap.values()).map((info) => info.name);
    message += `\nExclude these series from recommendations (already in favorites): ${allFavoriteNames.join(', ')}\n\n`;

    message += `Based on the above preferences, recommend 5-10 NEW TV series that this group would enjoy watching together. `;
    message += `Return the EXACT TITLE of each series as it appears in TMDB (The Movie Database). `;
    message += `Provide short justification for each recommendation explaining why it fits the group's collective tastes.`;

    return message;
  }
}
