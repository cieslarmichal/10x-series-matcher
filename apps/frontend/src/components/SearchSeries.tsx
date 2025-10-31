import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { searchSeries } from '../api/queries/searchSeries';
import { Series } from '../api/types/series';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { Badge } from './ui/Badge';
import { Search } from 'lucide-react';

interface SearchSeriesProps {
  onAddToProfile: (series: Series) => void;
  profileSeriesIds: Set<number>;
}

export default function SearchSeries({ onAddToProfile, profileSeriesIds }: SearchSeriesProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResult = await searchSeries(debouncedQuery);
        setResults(searchResult.data);
      } catch (err) {
        setError('Failed to search series. Please try again.');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <label
          htmlFor="series-search"
          className="sr-only"
        >
          Search for a TV series
        </label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          id="series-search"
          type="text"
          placeholder="Search for a TV series by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-6 text-base sm:text-lg rounded-full bg-muted border-2 border-transparent focus:border-primary focus:bg-background"
        />
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="p-4"
            >
              <div className="flex gap-4">
                <Skeleton className="h-36 w-24 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          {results.map((series) => (
            <Card
              key={series.id}
              className="p-4"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <div className="flex-shrink-0">
                  {series.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${series.posterPath}`}
                      alt={`${series.name} poster`}
                      className="h-36 w-24 object-cover rounded"
                    />
                  ) : (
                    <div className="h-36 w-24 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{series.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-4 mt-1">
                    {series.overview || 'No description available.'}
                  </p>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      {series?.firstAirDate && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {new Date(series.firstAirDate).getFullYear()}
                        </Badge>
                      )}
                      {series.originCountry && series.originCountry.length > 0 && (
                        <span className="text-xs text-muted-foreground">{series.originCountry[0]}</span>
                      )}
                      <span className="text-xs text-muted-foreground">★ {series.voteAverage.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      onAddToProfile(series);
                      setQuery(''); // Clear search input
                    }}
                    disabled={profileSeriesIds.has(series.id)}
                    variant={profileSeriesIds.has(series.id) ? 'secondary' : 'default'}
                  >
                    {profileSeriesIds.has(series.id) ? 'Added' : 'Add to Profile'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && query.trim() && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No series found for "{query}"</div>
      )}
    </div>
  );
}
