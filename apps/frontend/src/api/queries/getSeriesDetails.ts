import { apiRequest } from '../apiRequest';
import { SeriesDetails } from '../types/series';

export const getSeriesDetails = async (seriesTmdbId: number): Promise<SeriesDetails> => {
  return apiRequest<SeriesDetails>(`/series/${seriesTmdbId}`, {
    method: 'GET',
  });
};
