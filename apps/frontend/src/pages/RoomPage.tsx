import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, Users, ArrowLeft, UserMinus, LogOut } from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import { getWatchroomDetails, removeParticipant, leaveWatchroom } from '../api/queries/watchroom';
import type { WatchroomDetails } from '../api/types/watchroom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';

export default function RoomPage() {
  const { watchroomId } = useParams<{ watchroomId: string }>();
  const [room, setRoom] = useState<WatchroomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{
    open: boolean;
    participantId?: string;
    participantName?: string;
  }>({ open: false });
  const [confirmLeaveDialog, setConfirmLeaveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchRoomDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const fetchedRoom = await getWatchroomDetails(id);
      setRoom(fetchedRoom);
    } catch {
      toast.error('Failed to load watch room details.');
      navigate('/watchrooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (watchroomId) {
      fetchRoomDetails(watchroomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchroomId]);

  const handleCopyLink = () => {
    if (room) {
      const link = `${window.location.origin}/room/${room.publicLinkId}`;
      navigator.clipboard.writeText(link);
      toast.success('Room link copied to clipboard!');
    }
  };

  const handleRemoveParticipant = async () => {
    if (!watchroomId || !confirmRemoveDialog.participantId) {
      return;
    }

    try {
      setIsProcessing(true);
      await removeParticipant(watchroomId, confirmRemoveDialog.participantId);
      toast.success('Participant removed successfully!');
      setConfirmRemoveDialog({ open: false });
      fetchRoomDetails(watchroomId);
    } catch {
      toast.error('Failed to remove participant.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!watchroomId) {
      return;
    }

    try {
      setIsProcessing(true);
      await leaveWatchroom(watchroomId);
      toast.success('You have left the room.');
      navigate('/watchrooms');
    } catch {
      toast.error('Failed to leave the room.');
      setIsProcessing(false);
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/watchrooms')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-3xl font-bold">{room.name}</CardTitle>
                    {isOwner && (
                      <Badge
                        variant="secondary"
                        className="h-6 shrink-0"
                      >
                        Owner
                      </Badge>
                    )}
                  </div>
                  {room.description && <p className="text-muted-foreground mt-2">{room.description}</p>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full sm:w-auto"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-xl">
                  Participants
                  <span className="text-muted-foreground font-normal ml-2">({room.participants.length})</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{participant.name}</span>
                      {participant.id === room.ownerId && (
                        <Badge
                          variant="outline"
                          className="text-xs h-5"
                        >
                          Owner
                        </Badge>
                      )}
                    </div>
                    {isOwner && participant.id !== userData?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setConfirmRemoveDialog({
                            open: true,
                            participantId: participant.id,
                            participantName: participant.name,
                          })
                        }
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                      >
                        <UserMinus className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {!isOwner && (
                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                    onClick={() => setConfirmLeaveDialog(true)}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Room
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Recommendations</CardTitle>
              <CardDescription className="mt-2">
                AI-powered series recommendations will appear here once generated.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No recommendations yet.</p>
                {isOwner && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Recommendation generation will be available soon!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Remove Participant Confirmation Dialog */}
      <Dialog
        open={confirmRemoveDialog.open}
        onOpenChange={(open) => setConfirmRemoveDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Participant</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {confirmRemoveDialog.participantName} from this room? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveDialog({ open: false })}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveParticipant}
              disabled={isProcessing}
            >
              {isProcessing ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Room Confirmation Dialog */}
      <Dialog
        open={confirmLeaveDialog}
        onOpenChange={setConfirmLeaveDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this room? You can rejoin later using the invite link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLeaveDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveRoom}
              disabled={isProcessing}
            >
              {isProcessing ? 'Leaving...' : 'Leave Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
