import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { User, Mail, Calendar, Shield, Heart } from 'lucide-react';
import { getMyUser } from '../api/queries/getMyUser';
import { User as UserType } from '../api/types/user';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { userData } = useContext(AuthContext);
  const [userDetails, setUserDetails] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const user = await getMyUser();
        setUserDetails(user);
      } catch (error) {
        console.error('Failed to load user details:', error);
        toast.error('Failed to load profile information');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDetails();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const user = userDetails || userData;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-2">Unable to load profile information</p>
          </div>
        </div>
      </div>
    );
  }

  const accountAge = user.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your account information and preferences</p>
          </div>

          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl">{user.name}</h2>
                  <p className="text-muted-foreground">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Member for</p>
                      <p className="text-sm text-muted-foreground">
                        {accountAge} {accountAge === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Account Status</p>
                      <Badge
                        variant="secondary"
                        className="mt-1"
                      >
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Series Preferences</p>
                      <p className="text-sm text-muted-foreground">Manage your favorites</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Your activity on 10x Series Matcher</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <p className="text-sm text-muted-foreground">Favorite Series</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <p className="text-sm text-muted-foreground">Watch Rooms</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <p className="text-sm text-muted-foreground">Recommendations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{accountAge}</div>
                  <p className="text-sm text-muted-foreground">Days Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  Download Data
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  Delete Account
                </Button>
              </div>
              <hr className="border-border" />
              <div className="text-sm text-muted-foreground">
                <p>
                  Need help? Contact our support team at{' '}
                  <a
                    href="mailto:support@10x-series-matcher.com"
                    className="text-primary hover:underline"
                  >
                    support@10x-series-matcher.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
