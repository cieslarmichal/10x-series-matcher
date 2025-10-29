import { apiRequest } from '../apiRequest';

export interface SeriesExternalIds {
  readonly imdbId: string | null;
  readonly tvdbId: number | null;
  readonly facebookId: string | null;
  readonly instagramId: string | null;
  readonly twitterId: string | null;
}

export const getSeriesExternalIds = async (seriesTmdbId: number): Promise<SeriesExternalIds> => {
  return apiRequest<SeriesExternalIds>(`/series/${seriesTmdbId}/external-ids`, {
    method: 'GET',
  });
};
