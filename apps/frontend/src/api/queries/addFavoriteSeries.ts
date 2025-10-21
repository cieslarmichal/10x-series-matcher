import { apiRequest } from '../apiRequest';
import { FavoriteSeries } from '../types/series';

export const addFavoriteSeries = async (seriesTmdbId: number): Promise<FavoriteSeries> => {
  return apiRequest<FavoriteSeries>('/users/me/favorite-series', {
    method: 'POST',
    body: { seriesTmdbId },
  });
};
