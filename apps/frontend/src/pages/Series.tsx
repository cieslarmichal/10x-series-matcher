import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SearchSeries from '../components/SearchSeries';
import FavoriteSeriesList from '../components/FavoriteSeriesList';
import { getMyFavoriteSeries } from '../api/queries/getMyFavoriteSeries';
import { addFavoriteSeries } from '../api/queries/addFavoriteSeries';
import { removeFavoriteSeries } from '../api/queries/removeFavoriteSeries';
import { Series, FavoriteSeries } from '../api/types/series';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, List } from 'lucide-react';

export default function SeriesPage() {
  const [profileSeriesIds, setProfileSeriesIds] = useState<Set<number>>(new Set());
  const [mySeries, setMySeries] = useState<FavoriteSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'search' | 'manage'>('search');

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const response = await getMyFavoriteSeries();
        const series = response.data;
        setMySeries(series);
        setProfileSeriesIds(new Set(series.map((fav: FavoriteSeries) => fav.seriesTmdbId)));
      } catch (error) {
        console.error('Failed to load series:', error);
        toast.error('Failed to load your series');
      } finally {
        setIsLoading(false);
      }
    };

    loadSeries();
  }, []);

  const handleAddToProfile = async (series: Series) => {
    try {
      await addFavoriteSeries(series.id);
      setProfileSeriesIds((prev) => new Set(prev).add(series.id));
      // Add to series list
      const newSeries: FavoriteSeries = {
        seriesTmdbId: series.id,
        addedAt: new Date().toISOString(),
      };
      setMySeries((prev) => [...prev, newSeries]);
      toast.success(`"${series.name}" added to your profile!`);
    } catch (error) {
      console.error('Failed to add to profile:', error);
      toast.error('Failed to add series to your profile');
    }
  };

  const handleRemoveSeries = async (seriesTmdbId: number) => {
    try {
      await removeFavoriteSeries(seriesTmdbId);
      setProfileSeriesIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
      setMySeries((prev) => prev.filter((fav) => fav.seriesTmdbId !== seriesTmdbId));
      toast.success('Series removed from your profile');
    } catch (error) {
      console.error('Failed to remove series:', error);
      toast.error('Failed to remove series from your profile');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">My Series</h1>
            <p className="text-xl text-muted-foreground mt-2">Build your profile and manage your favorite TV series</p>
          </div>

          {/* View Toggle */}
          <div className="flex justify-center">
            <div className="bg-muted p-1 rounded-lg">
              <Button
                variant={activeView === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('search')}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Search & Add
              </Button>
              <Button
                variant={activeView === 'manage' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('manage')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                My Series ({mySeries.length})
              </Button>
            </div>
          </div>

          {/* Search View */}
          {activeView === 'search' && (
            <div className="space-y-6">
              <Card className="p-6">
                <SearchSeries
                  onAddToProfile={handleAddToProfile}
                  profileSeriesIds={profileSeriesIds}
                />
              </Card>

              <div className="text-center text-sm text-muted-foreground">
                <p>💡 Tip: Add series you love to build your taste profile for better group recommendations</p>
              </div>
            </div>
          )}

          {/* Manage View */}
          {activeView === 'manage' && (
            <div className="space-y-6">
              <Card className="p-6">
                <FavoriteSeriesList
                  favorites={mySeries}
                  onRemoveFavorite={handleRemoveSeries}
                  isLoading={isLoading}
                />
              </Card>

              {!isLoading && mySeries.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  <p>💡 Tip: Use your series to create watch rooms and get group recommendations</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
