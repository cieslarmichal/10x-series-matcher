import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent } from '@/tests/testUtils';
import SearchSeries from './SearchSeries';

describe('SearchSeries', () => {
  const mockOnAddToProfile = vi.fn();
  const mockProfileSeriesIds = new Set<number>();

  beforeEach(() => {
    mockOnAddToProfile.mockClear();
  });

  it('should render search input', () => {
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    expect(screen.getByPlaceholderText(/search for a tv series/i)).toBeInTheDocument();
  });

  it('should show search results', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking Bad');

    // Loading skeletons might appear briefly but results will definitely show
    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should display search results after typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    // Wait for debounce and API call
    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should filter results based on search query', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Better Call Saul');

    await waitFor(
      () => {
        expect(screen.getByText('Better Call Saul')).toBeInTheDocument();
        expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should show "Add to Profile" button for each result', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const addButtons = screen.getAllByRole('button', { name: /add to profile/i });
        expect(addButtons.length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );
  });

  it('should call onAddToProfile when clicking add button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const addButton = screen.getAllByRole('button', { name: /add to profile/i })[0];
    await user.click(addButton);

    expect(mockOnAddToProfile).toHaveBeenCalledTimes(1);
    expect(mockOnAddToProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1396,
        name: 'Breaking Bad',
      }),
    );
  });

  it('should clear search input after adding to profile', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const addButton = screen.getAllByRole('button', { name: /add to profile/i })[0];
    await user.click(addButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('should show "Added" for series already in profile', async () => {
    const profileWithSeries = new Set<number>([1396]);
    const user = userEvent.setup();

    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={profileWithSeries}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /added/i })).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should disable button for series already in profile', async () => {
    const profileWithSeries = new Set<number>([1396]);
    const user = userEvent.setup();

    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={profileWithSeries}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const addedButton = screen.getByRole('button', { name: /added/i });
        expect(addedButton).toBeDisabled();
      },
      { timeout: 1000 },
    );
  });

  it('should show "no results" message for empty results', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'NonExistentSeries12345');

    await waitFor(
      () => {
        expect(screen.getByText(/no series found for "NonExistentSeries12345"/i)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should display series rating', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText(/8\.9/)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should display series year', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('2008')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should clear results when search input is cleared', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        profileSeriesIds={mockProfileSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    await user.clear(searchInput);

    await waitFor(
      () => {
        expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });
});
