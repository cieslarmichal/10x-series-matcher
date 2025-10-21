import { apiRequest } from '../apiRequest';

export const removeFavoriteSeries = async (seriesTmdbId: number): Promise<void> => {
  return apiRequest<void>(`/users/me/favorite-series/${seriesTmdbId}`, {
    method: 'DELETE',
  });
};
