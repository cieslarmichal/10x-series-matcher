import { Type, type Static, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Config } from '../../../core/config.ts';
import { GetSeriesDetailsAction } from '../application/actions/getSeriesDetailsAction.ts';
import { GetSeriesExternalIdsAction } from '../application/actions/getSeriesExternalIdsAction.ts';
import { SearchSeriesAction } from '../application/actions/searchSeriesAction.ts';
import type { Series, SeriesDetails, SeriesExternalIds } from '../domain/types/series.ts';
import { TmdbServiceImpl } from '../infrastructure/services/tmdbServiceImpl.ts';

const seriesSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  posterPath: Type.Union([Type.String(), Type.Null()]),
  overview: Type.String(),
  firstAirDate: Type.Union([Type.String(), Type.Null()]),
  voteAverage: Type.Number(),
});

const seriesDetailsSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  posterPath: Type.Union([Type.String(), Type.Null()]),
  backdropPath: Type.Union([Type.String(), Type.Null()]),
  overview: Type.String(),
  firstAirDate: Type.Union([Type.String(), Type.Null()]),
  genres: Type.Array(Type.String()),
  numberOfSeasons: Type.Number(),
  numberOfEpisodes: Type.Number(),
  status: Type.String(),
  voteAverage: Type.Number(),
});

const seriesExternalIdsSchema = Type.Object({
  imdbId: Type.Union([Type.String(), Type.Null()]),
  tvdbId: Type.Union([Type.Number(), Type.Null()]),
  facebookId: Type.Union([Type.String(), Type.Null()]),
  instagramId: Type.Union([Type.String(), Type.Null()]),
  twitterId: Type.Union([Type.String(), Type.Null()]),
});

const seriesSearchResultSchema = Type.Object({
  data: Type.Array(seriesSchema),
  metadata: Type.Object({
    page: Type.Number(),
    pageSize: Type.Number(),
    total: Type.Number(),
  }),
});

export const seriesRoutes: FastifyPluginAsyncTypebox<{
  config: Config;
  loggerService: LoggerService;
  tokenService: TokenService;
}> = async function (fastify, opts) {
  const { config, tokenService } = opts;

  const mapSeriesToResponse = (series: Series): Static<typeof seriesSchema> => ({
    id: series.id,
    name: series.name,
    posterPath: series.posterPath,
    overview: series.overview,
    firstAirDate: series.firstAirDate,
    voteAverage: series.voteAverage,
  });

  const mapSeriesDetailsToResponse = (details: SeriesDetails): Static<typeof seriesDetailsSchema> => ({
    id: details.id,
    name: details.name,
    posterPath: details.posterPath,
    backdropPath: details.backdropPath,
    overview: details.overview,
    firstAirDate: details.firstAirDate,
    genres: details.genres,
    numberOfSeasons: details.numberOfSeasons,
    numberOfEpisodes: details.numberOfEpisodes,
    status: details.status,
    voteAverage: details.voteAverage,
  });

  const mapSeriesExternalIdsToResponse = (externalIds: SeriesExternalIds): Static<typeof seriesExternalIdsSchema> => ({
    imdbId: externalIds.imdbId,
    tvdbId: externalIds.tvdbId,
    facebookId: externalIds.facebookId,
    instagramId: externalIds.instagramId,
    twitterId: externalIds.twitterId,
  });

  const tmdbService = new TmdbServiceImpl(config.tmdb.apiKey, config.tmdb.baseUrl);
  const searchSeriesAction = new SearchSeriesAction(tmdbService);
  const getSeriesDetailsAction = new GetSeriesDetailsAction(tmdbService);
  const getSeriesExternalIdsAction = new GetSeriesExternalIdsAction(tmdbService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  fastify.get('/series/search', {
    schema: {
      querystring: Type.Object({
        query: Type.String({ minLength: 1 }),
        page: Type.Optional(Type.Number({ minimum: 1, maximum: 500 })),
      }),
      response: {
        200: seriesSearchResultSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { query, page = 1 } = request.query;

      const result = await searchSeriesAction.execute({ query, page });

      return reply.send({
        data: result.results.map(mapSeriesToResponse),
        metadata: {
          page: result.page,
          pageSize: 20,
          total: result.totalResults,
        },
      });
    },
  });

  fastify.get('/series/:seriesTmdbId', {
    schema: {
      params: Type.Object({
        seriesTmdbId: Type.Number({ minimum: 1 }),
      }),
      response: {
        200: seriesDetailsSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { seriesTmdbId } = request.params;

      const details = await getSeriesDetailsAction.execute(seriesTmdbId);

      return reply.send(mapSeriesDetailsToResponse(details));
    },
  });

  fastify.get('/series/:seriesTmdbId/external-ids', {
    schema: {
      params: Type.Object({
        seriesTmdbId: Type.Number({ minimum: 1 }),
      }),
      response: {
        200: seriesExternalIdsSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { seriesTmdbId } = request.params;

      const externalIds = await getSeriesExternalIdsAction.execute(seriesTmdbId);

      return reply.send(mapSeriesExternalIdsToResponse(externalIds));
    },
  });
};
