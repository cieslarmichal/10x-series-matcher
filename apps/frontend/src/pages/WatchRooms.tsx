import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Users, Plus, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface WatchRoom {
  id: string;
  name: string;
  participants: number;
  createdAt: string;
}

export default function WatchRoomsPage() {
  const [rooms] = useState<WatchRoom[]>([]); // This would be loaded from API

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  const handleCreateRoom = () => {
    // TODO: Implement room creation
    toast.info('Room creation will be implemented soon!');
  };

  const handleCopyLink = (roomId: string) => {
    // TODO: Copy room link to clipboard
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Room link copied to clipboard!');
  };

  const handleJoinRoom = (_roomId: string) => {
    // TODO: Navigate to room
    toast.info('Room joining will be implemented soon!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Watch Rooms</h1>
              <p className="text-muted-foreground mt-2">
                Create rooms and invite friends to get AI-powered series recommendations
              </p>
            </div>
            <Button
              onClick={handleCreateRoom}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Room
            </Button>
          </div>

          {/* Coming Soon Section */}
          <Card className="border-dashed border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">🎬 Watch Rooms Coming Soon</CardTitle>
              <CardDescription>This feature is under development. Soon you'll be able to:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Create Rooms</h3>
                  <p className="text-sm text-muted-foreground">Start a new watch room and invite your friends</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Group Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Combine everyone's favorite series for perfect matches
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Copy className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">AI Recommendations</h3>
                  <p className="text-sm text-muted-foreground">Get personalized suggestions based on group tastes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for existing rooms */}
          {rooms.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No watch rooms yet</h3>
              <p className="text-muted-foreground mt-2">
                Create your first room to start getting group recommendations!
              </p>
            </div>
          )}

          {/* Placeholder for future room list */}
          {rooms.length > 0 && (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <Card key={room.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <Badge variant="secondary">
                        <Users className="w-3 h-3 mr-1" />
                        {room.participants} participants
                      </Badge>
                    </div>
                    <CardDescription>Created {new Date(room.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(room.id)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleJoinRoom(room.id)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Room
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
