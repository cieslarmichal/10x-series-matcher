import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import { getPublicWatchroomDetails, joinWatchroom } from '../api/queries/watchroom';
import type { PublicWatchroomDetails } from '../api/types/watchroom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function JoinRoomPage() {
  const { publicLinkId } = useParams<{ publicLinkId: string }>();
  const [room, setRoom] = useState<PublicWatchroomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (publicLinkId) {
      fetchRoomDetails(publicLinkId);
    }
  }, [publicLinkId]);

  const fetchRoomDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const fetchedRoom = await getPublicWatchroomDetails(id);
      setRoom(fetchedRoom);
    } catch (error) {
      toast.error('Failed to load watch room details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!publicLinkId) {
      return;
    }

    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      setIsJoining(true);
      const watchroom = await joinWatchroom(publicLinkId);
      toast.success('Successfully joined the watch room!');
      navigate(`/watchrooms/${watchroom.id}`);
    } catch (error) {
      toast.error('Failed to join the watch room.');
    } finally {
      setIsJoining(false);
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
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {room.name}</CardTitle>
          <CardDescription>You have been invited by {room.ownerName} to join this watch room.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {room.description && <p className="text-sm text-muted-foreground">{room.description}</p>}
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-2" />
            {room.participantCount} {room.participantCount === 1 ? 'participant' : 'participants'}
          </div>
          <Button
            onClick={handleJoin}
            className="w-full"
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : userData ? 'Join Watch Room' : 'Login to Join'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
