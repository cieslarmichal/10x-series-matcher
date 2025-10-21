import { apiRequest } from '../apiRequest';
import { SeriesSearchResult } from '../types/series';

export const searchSeries = async (query: string, page: number = 1): Promise<SeriesSearchResult> => {
  const params = new URLSearchParams({
    query,
    page: page.toString(),
  });

  return apiRequest<SeriesSearchResult>(`/series/search?${params}`, {
    method: 'GET',
  });
};
