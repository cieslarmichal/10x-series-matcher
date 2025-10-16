export interface Series {
  readonly id: number;
  readonly name: string;
  readonly posterPath: string | null;
  readonly overview: string;
  readonly firstAirDate: string | null;
  readonly voteAverage: number;
}

export interface SeriesDetails {
  readonly id: number;
  readonly name: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  readonly overview: string;
  readonly firstAirDate: string | null;
  readonly genres: string[];
  readonly numberOfSeasons: number;
  readonly numberOfEpisodes: number;
  readonly status: string;
  readonly voteAverage: number;
}

export interface SeriesSearchResult {
  readonly page: number;
  readonly results: Series[];
  readonly totalPages: number;
  readonly totalResults: number;
}
