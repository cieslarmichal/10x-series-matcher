import { ExternalServiceError } from '../../../../common/errors/externalServiceError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { SearchSeriesParams, SeriesSearchResult, TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeries, TmdbSeriesDetails, TmdbSeriesExternalIds } from '../../domain/types/tmdbSeries.ts';

interface TmdbApiSeriesResponse {
  readonly id: number;
  readonly name: string;
  readonly poster_path: string | null;
  readonly overview: string;
  readonly first_air_date?: string;
  readonly vote_average: number;
  readonly genre_ids?: number[];
  readonly origin_country?: string[];
  readonly original_language?: string;
}

interface TmdbApiSearchResponse {
  readonly page: number;
  readonly results: TmdbApiSeriesResponse[];
  readonly total_pages: number;
  readonly total_results: number;
}

interface TmdbApiGenre {
  readonly name: string;
}

interface TmdbApiSeriesDetailsResponse {
  readonly id: number;
  readonly name: string;
  readonly poster_path: string | null;
  readonly backdrop_path: string | null;
  readonly overview: string;
  readonly first_air_date: string | null;
  readonly genres: TmdbApiGenre[];
  readonly number_of_seasons: number;
  readonly number_of_episodes: number;
  readonly status: string;
  readonly vote_average: number;
}

interface TmdbApiExternalIdsResponse {
  readonly imdb_id: string | null;
  readonly tvdb_id: number | null;
  readonly facebook_id: string | null;
  readonly instagram_id: string | null;
  readonly twitter_id: string | null;
}

export class TmdbServiceImpl implements TmdbService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  public constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  public async searchSeries(params: SearchSeriesParams): Promise<SeriesSearchResult> {
    const { query, page } = params;

    const url = new URL(`${this.baseUrl}/search/tv`);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('query', query);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('include_adult', 'false');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ExternalServiceError({
          service: 'TMDB API',
          reason: `TMDB API request failed with status ${response.status.toString()}`,
          responseBody: errorBody,
        });
      }

      const data = (await response.json()) as TmdbApiSearchResponse;

      return this.mapToSeriesSearchResult(data);
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      throw new ExternalServiceError({
        service: 'TMDB API',
        reason: 'Failed to fetch data from TMDB API',
        originalError: error,
      });
    }
  }

  private mapToSeriesSearchResult(apiResponse: TmdbApiSearchResponse): SeriesSearchResult {
    const result: SeriesSearchResult = {
      page: apiResponse.page,
      results: apiResponse.results.map((item) => this.mapToSeries(item)),
      totalPages: apiResponse.total_pages,
      totalResults: apiResponse.total_results,
    };

    return result;
  }

  public async getSeriesDetails(seriesTmdbId: number): Promise<TmdbSeriesDetails> {
    const url = new URL(`${this.baseUrl}/tv/${seriesTmdbId.toString()}`);
    url.searchParams.append('api_key', this.apiKey);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        throw new ResourceNotFoundError({
          resource: 'Series',
          reason: `Series with TMDB ID ${seriesTmdbId.toString()} not found`,
          seriesTmdbId,
        });
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ExternalServiceError({
          service: 'TMDB API',
          reason: `TMDB API request failed with status ${response.status.toString()}`,
          responseBody: errorBody,
        });
      }

      const data = (await response.json()) as TmdbApiSeriesDetailsResponse;

      return this.mapToSeriesDetails(data);
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new ExternalServiceError({
        service: 'TMDB API',
        reason: 'Failed to fetch series details from TMDB API',
        originalError: error,
      });
    }
  }

  public async getSeriesExternalIds(seriesTmdbId: number): Promise<TmdbSeriesExternalIds> {
    const url = new URL(`${this.baseUrl}/tv/${seriesTmdbId.toString()}/external_ids`);
    url.searchParams.append('api_key', this.apiKey);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        throw new ResourceNotFoundError({
          resource: 'Series',
          reason: `Series with TMDB ID ${seriesTmdbId.toString()} not found`,
          seriesTmdbId,
        });
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ExternalServiceError({
          service: 'TMDB API',
          reason: `TMDB API request failed with status ${response.status.toString()}`,
          responseBody: errorBody,
        });
      }

      const data = (await response.json()) as TmdbApiExternalIdsResponse;

      return this.mapToSeriesExternalIds(data);
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new ExternalServiceError({
        service: 'TMDB API',
        reason: 'Failed to fetch series external IDs from TMDB API',
        originalError: error,
      });
    }
  }

  private mapToSeries(apiSeries: TmdbApiSeriesResponse): TmdbSeries {
    const series: TmdbSeries = {
      id: apiSeries.id,
      name: apiSeries.name,
      posterPath: apiSeries.poster_path,
      overview: apiSeries.overview,
      firstAirDate: apiSeries.first_air_date || null,
      voteAverage: apiSeries.vote_average,
      genreIds: apiSeries.genre_ids || [],
      originCountry: apiSeries.origin_country || [],
      originalLanguage: apiSeries.original_language || 'en',
    };

    return series;
  }

  private mapToSeriesDetails(apiDetails: TmdbApiSeriesDetailsResponse): TmdbSeriesDetails {
    return {
      id: apiDetails.id,
      name: apiDetails.name,
      posterPath: apiDetails.poster_path,
      backdropPath: apiDetails.backdrop_path,
      overview: apiDetails.overview,
      firstAirDate: apiDetails.first_air_date,
      genres: apiDetails.genres.map((genre) => genre.name),
      numberOfSeasons: apiDetails.number_of_seasons,
      numberOfEpisodes: apiDetails.number_of_episodes,
      status: apiDetails.status,
      voteAverage: apiDetails.vote_average,
    };
  }

  private mapToSeriesExternalIds(apiExternalIds: TmdbApiExternalIdsResponse): TmdbSeriesExternalIds {
    return {
      imdbId: apiExternalIds.imdb_id,
      tvdbId: apiExternalIds.tvdb_id,
      facebookId: apiExternalIds.facebook_id,
      instagramId: apiExternalIds.instagram_id,
      twitterId: apiExternalIds.twitter_id,
    };
  }
}
