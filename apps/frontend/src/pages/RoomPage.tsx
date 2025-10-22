import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, Users, ArrowLeft } from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import { getWatchroomDetails } from '../api/queries/watchroom';
import type { WatchroomDetails } from '../api/types/watchroom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function RoomPage() {
  const { watchroomId } = useParams<{ watchroomId: string }>();
  const [room, setRoom] = useState<WatchroomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (watchroomId) {
      fetchRoomDetails(watchroomId);
    }
  }, [watchroomId]);

  const fetchRoomDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const fetchedRoom = await getWatchroomDetails(id);
      setRoom(fetchedRoom);
    } catch (error) {
      toast.error('Failed to load watch room details.');
      navigate('/watchrooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (room) {
      const link = `${window.location.origin}/room/${room.publicLinkId}`;
      navigator.clipboard.writeText(link);
      toast.success('Room link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading room details...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Room Not Found</CardTitle>
            <CardDescription>The watch room you are looking for does not exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/watchrooms')}
              className="w-full"
            >
              Back to Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = userData?.id === room.ownerId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/watchrooms')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{room.name}</CardTitle>
                  {room.description && <CardDescription>{room.description}</CardDescription>}
                </div>
                {isOwner && (
                  <Badge variant="secondary">Owner</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Invite Link
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({room.participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <span className="font-medium">{participant.name}</span>
                    {participant.id === room.ownerId && (
                      <Badge variant="outline" className="text-xs">
                        Owner
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
              <CardDescription>
                AI-powered series recommendations will appear here once generated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No recommendations yet.</p>
                {isOwner && (
                  <p className="text-sm mt-2">
                    Recommendation generation will be available soon!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
