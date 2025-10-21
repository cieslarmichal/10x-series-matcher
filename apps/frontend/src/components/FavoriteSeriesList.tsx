import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getSeriesDetails } from '../api/queries/getSeriesDetails';
import { FavoriteSeries, SeriesDetails } from '../api/types/series';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

interface FavoriteSeriesListProps {
  favorites: FavoriteSeries[];
  onRemoveFavorite: (seriesTmdbId: number) => void;
  isLoading: boolean;
}

export default function FavoriteSeriesList({
  favorites,
  onRemoveFavorite,
  isLoading: externalLoading,
}: FavoriteSeriesListProps) {
  const [seriesDetails, setSeriesDetails] = useState<Map<number, SeriesDetails>>(new Map());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadSeriesDetails = async () => {
      if (favorites.length === 0) {
        setSeriesDetails(new Map());
        return;
      }

      // Load series details for each favorite
      const detailsPromises = favorites.map(async (favorite: FavoriteSeries) => {
        try {
          const details = await getSeriesDetails(favorite.seriesTmdbId);
          return { id: favorite.seriesTmdbId, details };
        } catch (err) {
          console.error(`Failed to load details for series ${favorite.seriesTmdbId}:`, err);
          return null;
        }
      });

      const detailsResults = await Promise.all(detailsPromises);
      const detailsMap = new Map<number, SeriesDetails>();
      detailsResults.forEach((result: { id: number; details: SeriesDetails } | null) => {
        if (result) {
          detailsMap.set(result.id, result.details);
        }
      });

      setSeriesDetails(detailsMap);
    };

    loadSeriesDetails();
  }, [favorites]);

  const handleRemoveFavorite = async (seriesTmdbId: number) => {
    // Add to removing set for animation
    setRemovingIds((prev) => new Set(prev).add(seriesTmdbId));

    try {
      await onRemoveFavorite(seriesTmdbId);

      // Delay the actual removal to allow fade-out animation
      setTimeout(() => {
        setSeriesDetails((prev) => {
          const newMap = new Map(prev);
          newMap.delete(seriesTmdbId);
          return newMap;
        });
        setRemovingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(seriesTmdbId);
          return newSet;
        });
      }, 300);
    } catch (err) {
      // Remove from removing set if failed
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
      console.error('Failed to remove favorite:', err);
    }
  };

  if (externalLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">My Favorite Series</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="space-y-2"
            >
              <Skeleton className="w-full h-48 rounded-lg" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">My Favorite Series</h2>

      {favorites.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No favorite series yet.</p>
          <p className="text-sm mt-1">Search for series above and add them to your favorites!</p>
        </div>
      ) : (
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {favorites.map((favorite) => {
              const details = seriesDetails.get(favorite.seriesTmdbId);
              const isRemoving = removingIds.has(favorite.seriesTmdbId);

              return (
                <div
                  key={favorite.seriesTmdbId}
                  className={`group relative transition-all duration-300 ${
                    isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <div className="w-full h-48 overflow-hidden rounded-lg bg-gray-100 relative">
                    {details?.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${details.posterPath}`}
                        alt={`${details.name} poster`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center bg-gray-200"><span class="text-xs text-gray-500">No Image</span></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-xs text-gray-500">No Image</span>
                      </div>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleRemoveFavorite(favorite.seriesTmdbId)}
                          variant="destructive"
                          size="icon"
                          className="absolute top-0 right-0 w-7 h-7 bg-black hover:bg-gray-800 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 focus:opacity-100"
                          aria-label={`Remove ${details?.name || 'series'} from favorites`}
                        >
                          <X />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-gray-800 text-white"
                      >
                        Remove from favorites
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-xs font-medium truncate leading-tight text-center">
                      {details?.name || `Series ${favorite.seriesTmdbId}`}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
