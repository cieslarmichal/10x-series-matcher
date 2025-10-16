import type { SeriesDetails, SeriesSearchResult } from '../types/series.ts';

export interface SearchSeriesParams {
  readonly query: string;
  readonly page: number;
}

export interface TmdbService {
  searchSeries(params: SearchSeriesParams): Promise<SeriesSearchResult>;
  getSeriesDetails(seriesTmdbId: number): Promise<SeriesDetails>;
}
