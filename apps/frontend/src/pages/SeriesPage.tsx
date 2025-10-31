import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SearchSeries from '../components/SearchSeries.tsx';
import FavoriteSeriesList from '../components/FavoriteSeriesList.tsx';
import { getMyFavoriteSeries } from '../api/queries/getMyFavoriteSeries.ts';
import { addFavoriteSeries } from '../api/queries/addFavoriteSeries.ts';
import { removeFavoriteSeries } from '../api/queries/removeFavoriteSeries.ts';
import { Series, FavoriteSeries } from '../api/types/series.ts';

export default function SeriesPage() {
  const [profileSeriesIds, setProfileSeriesIds] = useState<Set<number>>(new Set());
  const [mySeries, setMySeries] = useState<FavoriteSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleRemoveSeries = async (seriesTmdbId: number): Promise<void> => {
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
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-12">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">My Favorite Series</h1>
              <p className="text-xl text-muted-foreground mt-3 max-w-2xl mx-auto">
                Build your taste profile by adding shows you love. The more you add, the better your group
                recommendations will be.
              </p>
            </div>

            {/* Search Section */}
            <SearchSeries
              onAddToProfile={handleAddToProfile}
              profileSeriesIds={profileSeriesIds}
            />

            {/* My Series Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Your Favorite Shows ({mySeries.length})
                </h2>
              </div>
              <FavoriteSeriesList
                favorites={mySeries}
                onRemoveFavorite={handleRemoveSeries}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
