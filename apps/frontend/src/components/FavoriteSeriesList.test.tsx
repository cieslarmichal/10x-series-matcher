import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoriteSeriesList from './FavoriteSeriesList';
import type { FavoriteSeries } from '../api/types/series';

// Mock the getSeriesDetails function
vi.mock('../api/queries/getSeriesDetails', () => ({
  getSeriesDetails: vi.fn(),
}));

import { getSeriesDetails } from '../api/queries/getSeriesDetails';

describe('FavoriteSeriesList', () => {
  const mockOnRemoveFavorite = vi.fn();
  const mockGetSeriesDetails = vi.mocked(getSeriesDetails);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading skeletons when isLoading is true', () => {
    render(
      <FavoriteSeriesList
        favorites={[]}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={true}
      />,
    );

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no favorites', () => {
    render(
      <FavoriteSeriesList
        favorites={[]}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No favorite series yet.')).toBeInTheDocument();
    expect(screen.getByText(/Search for series above/i)).toBeInTheDocument();
  });

  it('should render favorite series with details', async () => {
    const mockFavorites: FavoriteSeries[] = [
      { seriesTmdbId: 1, addedAt: '2025-01-01' },
      { seriesTmdbId: 2, addedAt: '2025-01-02' },
    ];

    mockGetSeriesDetails.mockImplementation((tmdbId: number) => {
      if (tmdbId === 1) {
        return Promise.resolve({
          id: 1,
          name: 'Breaking Bad',
          posterPath: '/poster1.jpg',
          overview: 'A chemistry teacher turned meth producer',
          firstAirDate: '2008-01-20',
          genres: ['Drama', 'Crime'],
          numberOfSeasons: 5,
          numberOfEpisodes: 62,
          backdropPath: '/backdrop1.jpg',
          status: 'Ended',
          voteAverage: 9.5,
          genreIds: [18, 80],
          originCountry: ['US'],
          originalLanguage: 'en',
        });
      }
      return Promise.resolve({
        id: 2,
        name: 'Game of Thrones',
        posterPath: '/poster2.jpg',
        overview: 'Epic fantasy series',
        firstAirDate: '2011-04-17',
        genres: ['Fantasy', 'Drama'],
        numberOfSeasons: 8,
        numberOfEpisodes: 73,
        backdropPath: '/backdrop2.jpg',
        status: 'Ended',
        voteAverage: 9.2,
        genreIds: [10765, 18],
        originCountry: ['US'],
        originalLanguage: 'en',
      });
    });

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      expect(screen.getByText('Game of Thrones')).toBeInTheDocument();
    });

    expect(mockGetSeriesDetails).toHaveBeenCalledWith(1);
    expect(mockGetSeriesDetails).toHaveBeenCalledWith(2);
  });

  it('should render series image with correct src', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, addedAt: '2025-01-01' }];

    mockGetSeriesDetails.mockResolvedValue({
      id: 1,
      name: 'Breaking Bad',
      posterPath: '/poster1.jpg',
      overview: 'A chemistry teacher',
      firstAirDate: '2008-01-20',
      genres: ['Drama'],
      numberOfSeasons: 5,
      numberOfEpisodes: 62,
      backdropPath: '/backdrop1.jpg',
      status: 'Ended',
      voteAverage: 9.5,
      genreIds: [18],
      originCountry: ['US'],
      originalLanguage: 'en',
    });

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      const image = screen.getByAltText('Breaking Bad poster') as HTMLImageElement;
      expect(image.src).toContain('https://image.tmdb.org/t/p/w342/poster1.jpg');
    });
  });

  it('should show "No Image Available" when posterPath is missing', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, addedAt: '2025-01-01' }];

    mockGetSeriesDetails.mockResolvedValue({
      id: 1,
      name: 'Series Without Poster',
      posterPath: null,
      overview: 'Test series',
      firstAirDate: '2020-01-01',
      genres: ['Drama'],
      numberOfSeasons: 1,
      numberOfEpisodes: 10,
      backdropPath: null,
      status: 'Ended',
      voteAverage: 7.0,
      genreIds: [18],
      originCountry: ['US'],
      originalLanguage: 'en',
    });

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('No Image Available')).toBeInTheDocument();
    });
  });

  it('should call onRemoveFavorite when remove button is clicked', async () => {
    const user = userEvent.setup();
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, addedAt: '2025-01-01' }];

    mockGetSeriesDetails.mockResolvedValue({
      id: 1,
      name: 'Breaking Bad',
      posterPath: '/poster1.jpg',
      overview: 'A chemistry teacher',
      firstAirDate: '2008-01-20',
      genres: ['Drama'],
      numberOfSeasons: 5,
      numberOfEpisodes: 62,
      backdropPath: '/backdrop1.jpg',
      status: 'Ended',
      voteAverage: 9.5,
      genreIds: [18],
      originCountry: ['US'],
      originalLanguage: 'en',
    });

    mockOnRemoveFavorite.mockResolvedValue(undefined);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    const removeButton = screen.getByLabelText('Remove Breaking Bad from favorites');
    await user.click(removeButton);

    expect(mockOnRemoveFavorite).toHaveBeenCalledWith(1);
  });

  it('should handle error when loading series details fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockFavorites: FavoriteSeries[] = [
      { seriesTmdbId: 1, addedAt: '2025-01-01' },
      { seriesTmdbId: 2, addedAt: '2025-01-02' },
    ];

    mockGetSeriesDetails.mockImplementation((tmdbId: number) => {
      if (tmdbId === 1) {
        return Promise.reject(new Error('Failed to load'));
      }
      return Promise.resolve({
        id: 2,
        name: 'Game of Thrones',
        posterPath: '/poster2.jpg',
        overview: 'Epic fantasy',
        firstAirDate: '2011-04-17',
        genres: ['Fantasy'],
        numberOfSeasons: 8,
        numberOfEpisodes: 73,
        backdropPath: '/backdrop2.jpg',
        status: 'Ended',
        voteAverage: 9.2,
        genreIds: [10765],
        originCountry: ['US'],
        originalLanguage: 'en',
      });
    });

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Game of Thrones')).toBeInTheDocument();
    });

    // Series 1 should render with fallback ID when it failed to load details
    expect(screen.getByText('Series 1')).toBeInTheDocument();

    // But it should not show the series name since details loading failed
    expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle error when removing favorite fails', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, addedAt: '2025-01-01' }];

    mockGetSeriesDetails.mockResolvedValue({
      id: 1,
      name: 'Breaking Bad',
      posterPath: '/poster1.jpg',
      overview: 'A chemistry teacher',
      firstAirDate: '2008-01-20',
      genres: ['Drama'],
      numberOfSeasons: 5,
      numberOfEpisodes: 62,
      backdropPath: '/backdrop1.jpg',
      status: 'Ended',
      voteAverage: 9.5,
      genreIds: [18],
      originCountry: ['US'],
      originalLanguage: 'en',
    });

    mockOnRemoveFavorite.mockRejectedValue(new Error('Failed to remove'));

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    const removeButton = screen.getByLabelText('Remove Breaking Bad from favorites');
    await user.click(removeButton);

    expect(mockOnRemoveFavorite).toHaveBeenCalledWith(1);

    // Series should still be visible after failed removal
    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should display fallback ID when series details are not loaded yet', () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 123, addedAt: '2025-01-01' }];

    // Don't mock getSeriesDetails so it won't load immediately
    mockGetSeriesDetails.mockImplementation(() => new Promise(() => {}));

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Series 123')).toBeInTheDocument();
  });

  it('should clear series details when favorites array becomes empty', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, addedAt: '2025-01-01' }];

    mockGetSeriesDetails.mockResolvedValue({
      id: 1,
      name: 'Breaking Bad',
      posterPath: '/poster1.jpg',
      overview: 'A chemistry teacher',
      firstAirDate: '2008-01-20',
      genres: ['Drama'],
      numberOfSeasons: 5,
      numberOfEpisodes: 62,
      backdropPath: '/backdrop1.jpg',
      status: 'Ended',
      voteAverage: 9.5,
      genreIds: [18],
      originCountry: ['US'],
      originalLanguage: 'en',
    });

    const { rerender } = render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    // Rerender with empty favorites
    rerender(
      <FavoriteSeriesList
        favorites={[]}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No favorite series yet.')).toBeInTheDocument();
    expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument();
  });
});
