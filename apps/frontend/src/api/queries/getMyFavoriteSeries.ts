import { apiRequest } from '../apiRequest';
import { FavoriteSeriesList } from '../types/series';

export const getMyFavoriteSeries = async (page: number = 1, limit: number = 20): Promise<FavoriteSeriesList> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return apiRequest<FavoriteSeriesList>(`/users/me/favorite-series?${params}`, {
    method: 'GET',
  });
};
