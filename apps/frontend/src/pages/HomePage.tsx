import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyFavoriteSeries } from '../api/queries/getMyFavoriteSeries';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Heart, Users } from 'lucide-react';

export default function HomePage() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadFavoritesCount = async () => {
      if (!userData) return;

      try {
        const result = await getMyFavoriteSeries();
        setFavoritesCount(result.data.length);
      } catch (error) {
        console.error('Failed to load favorites count:', error);
      }
    };

    loadFavoritesCount();
  }, [userData]);

  if (!userDataInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          {userData ? (
            <div className="animate-fade-in space-y-12">
              {/* Welcome Section */}
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tighter">
                  Ready to find your group's next favorite series?
                </h1>
                <p className="text-xl sm:text-2xl text-muted-foreground font-light tracking-tight max-w-4xl mx-auto">
                  Build your profile and create watch rooms for AI-powered recommendations
                </p>
              </div>

              {/* Profile Status */}
              <Card className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700">
                <CardContent className="pt-8 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Series Count */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                          <Heart className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-foreground">{favoritesCount}</p>
                          <p className="text-sm text-muted-foreground">Series in profile</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Profile completion</span>
                          <span className="text-sm text-muted-foreground">{favoritesCount}/10 series</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              favoritesCount === 0
                                ? 'bg-gray-300 dark:bg-gray-600 w-0'
                                : favoritesCount < 5
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min((favoritesCount / 10) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Add 10+ series for best recommendations</p>
                      </div>
                    </div>

                    {/* Action & Tips */}
                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mt-1">
                            {favoritesCount < 5 ? (
                              <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <div className="w-5 h-5 bg-emerald-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground mb-1">
                              {favoritesCount < 5 ? 'Not ready to create watch rooms' : 'Ready to create watch rooms!'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {favoritesCount < 5
                                ? 'Add at least 5 series to unlock watch room creation'
                                : 'Your profile is ready for AI-powered group suggestions'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Quick tips</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start space-x-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>Add series you actually enjoy watching</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>Mix different genres for diverse recommendations</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>10+ series gives the AI more to work with</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center">Quick Actions</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-primary/50"
                    onClick={() => navigate('/series')}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full group-hover:bg-red-200 dark:group-hover:bg-red-900/30 transition-colors">
                          <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">My Series</CardTitle>
                      <CardDescription className="text-base">
                        Search, add, and manage your TV series profile for better group recommendations
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-primary/50"
                    onClick={() => navigate('/watchrooms')}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                          <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">Create Watch Room</CardTitle>
                      <CardDescription className="text-base">
                        Start a room, invite friends, and get AI-powered group recommendations
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center animate-fade-in">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tighter">
                10x Series Matcher
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground font-light tracking-tight max-w-4xl mx-auto mb-8">
                Find the perfect TV series for you and your friends. Build your taste profile and get personalized
                recommendations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/login?tab=register')}
                  className="bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="border-border hover:bg-accent"
                >
                  Sign In
                </Button>
              </div>

              {/* Decorative line */}
              <div className="mt-12 flex justify-center">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
