import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, Users, ArrowLeft, UserMinus, LogOut, Sparkles, TvMinimalPlay, Trash2, Calendar, X } from 'lucide-react';

import { AuthContext } from '../context/AuthContext.tsx';
import {
  getWatchroomDetails,
  removeParticipant,
  leaveWatchroom,
  deleteWatchroom,
  generateRecommendations,
  checkRecommendationStatus,
  getRecommendations,
  deleteRecommendation,
} from '../api/queries/watchroom.ts';
import { getSeriesDetails } from '../api/queries/getSeriesDetails.ts';
import { getSeriesExternalIds } from '../api/queries/getSeriesExternalIds.ts';
import type { WatchroomDetails } from '../api/types/watchroom.ts';
import type { Recommendation } from '../api/types/recommendation.ts';
import type { SeriesDetails } from '../api/types/series.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { EditWatchRoomModal } from '../components/EditWatchRoomModal.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog.tsx';

interface RecommendationWithDetails extends Recommendation {
  seriesDetails?: SeriesDetails;
}

export default function WatchRoomDetailsPage() {
  const { watchroomId } = useParams<{ watchroomId: string }>();
  const [room, setRoom] = useState<WatchroomDetails | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{
    open: boolean;
    participantId?: string;
    participantName?: string;
  }>({ open: false });
  const [confirmLeaveDialog, setConfirmLeaveDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const fetchRecommendations = async (id: string) => {
    try {
      setIsLoadingRecommendations(true);
      const fetchedRecommendations = await getRecommendations(id);

      // Fetch series details for each recommendation
      const recommendationsWithDetails = await Promise.all(
        fetchedRecommendations.map(async (rec) => {
          try {
            const seriesDetails = await getSeriesDetails(rec.seriesTmdbId);
            return { ...rec, seriesDetails };
          } catch {
            // If fetching series details fails, return recommendation without details
            return rec;
          }
        }),
      );

      setRecommendations(recommendationsWithDetails);
    } catch {
      // Silently fail - recommendations might not exist yet
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (watchroomId) {
      fetchRoomDetails(watchroomId);
      fetchRecommendations(watchroomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchroomId]);

  const handleCopyLink = () => {
    if (room) {
      const link = `${window.location.origin}/watchrooms/public/${room.publicLinkId}`;
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

  const handleDeleteRoom = async () => {
    if (!watchroomId) {
      return;
    }

    try {
      setIsProcessing(true);
      await deleteWatchroom(watchroomId);
      toast.success('Watch room deleted successfully!');
      navigate('/watchrooms');
    } catch {
      toast.error('Failed to delete room.');
      setIsProcessing(false);
      setConfirmDeleteDialog(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!watchroomId) {
      return;
    }

    try {
      setIsGenerating(true);

      // Start generation and get requestId
      const { requestId, message } = await generateRecommendations(watchroomId);

      toast.success('Generating recommendations...', {
        description: message,
      });

      // Poll for status using requestId every 2 seconds, max 30 attempts (60 seconds total)
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 2000;

      const pollForStatus = async (): Promise<void> => {
        attempts++;

        try {
          const statusResult = await checkRecommendationStatus(watchroomId, requestId);

          if (statusResult.status === 'completed') {
            // Fetch the actual recommendations with series details
            await fetchRecommendations(watchroomId);

            toast.success('Recommendations ready!', {
              description: `Found ${statusResult.count} series for your group.`,
            });
            setIsGenerating(false);
            return;
          }
        } catch (error) {
          // If status check fails, log but continue polling
          console.error('Status check failed:', error);
        }

        if (attempts >= maxAttempts) {
          toast.error('Generation taking longer than expected', {
            description: 'Please refresh the page in a moment.',
          });
          setIsGenerating(false);
          return;
        }

        // Continue polling
        setTimeout(() => pollForStatus(), pollInterval);
      };

      // Start polling after initial delay
      setTimeout(() => pollForStatus(), pollInterval);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast.error('Failed to generate recommendations.');
      setIsGenerating(false);
    }
  };

  const handleDeleteRecommendation = async (recommendationId: string) => {
    if (!watchroomId) {
      return;
    }

    try {
      await deleteRecommendation(watchroomId, recommendationId);
      setRecommendations((prev) => prev.filter((rec) => rec.id !== recommendationId));
      toast.success('Recommendation removed');
    } catch {
      toast.error('Failed to remove recommendation');
    }
  };

  const handleOpenImdb = async (seriesTmdbId: number, event?: React.MouseEvent) => {
    // Only handle left-click (button 0) and middle-click (button 1)
    if (event && event.button !== 0 && event.button !== 1) {
      return;
    }

    try {
      const externalIds = await getSeriesExternalIds(seriesTmdbId);

      if (externalIds.imdbId) {
        window.open(`https://www.imdb.com/title/${externalIds.imdbId}`);
      } else {
        toast.error('IMDb ID not available for this series');
      }
    } catch {
      toast.error('Failed to get IMDb link');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="space-y-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/watchrooms')}
            className="group -ml-2 hover:bg-primary/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Rooms
          </Button>

          {/* Room Header Card */}
          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative pb-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center flex-wrap gap-3">
                    <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                      {room.name}
                    </CardTitle>
                    {isOwner && (
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-sm">
                        <Users className="w-3 h-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                  {room.description && (
                    <CardDescription className="text-base leading-relaxed">{room.description}</CardDescription>
                  )}
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Created{' '}
                    {new Date(room.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    onClick={handleCopyLink}
                    className="sm:self-start shadow-md hover:shadow-lg transition-all"
                    data-testid="copy-invite-link-button"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  {isOwner && (
                    <>
                      <EditWatchRoomModal
                        watchroomId={room.id}
                        currentName={room.name}
                        currentDescription={room.description}
                        onRoomUpdated={() => fetchRoomDetails(watchroomId!)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setConfirmDeleteDialog(true)}
                        className="sm:self-start hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Room
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Participants Card */}
          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Participants</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {room.participants.length} {room.participants.length === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                {room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-md ring-2 ring-background group-hover:ring-primary/20 transition-all">
                          <span className="text-lg font-bold text-primary-foreground">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {participant.id === room.ownerId && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm ring-2 ring-background">
                            <Users className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{participant.name}</span>
                        {participant.id === room.ownerId && (
                          <Badge
                            variant="outline"
                            className="text-xs w-fit bg-primary/5 text-primary border-primary/30"
                          >
                            Room Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isOwner && participant.id !== userData?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setConfirmRemoveDialog({
                            open: true,
                            participantId: participant.id,
                            participantName: participant.name,
                          })
                        }
                        className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {!isOwner && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 rounded-lg shadow-sm"
                    onClick={() => setConfirmLeaveDialog(true)}
                    data-testid="leave-room-button"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Room
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations Card */}
          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">AI Recommendations</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Get personalized series recommendations based on everyone's preferences
                  </CardDescription>
                </div>
                {isOwner && (
                  <Button
                    onClick={handleGenerateRecommendations}
                    // disabled={isGenerating || room.participants.length < 2}
                    className="sm:self-start shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    data-testid="generate-recommendations-button"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRecommendations ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground px-1">Loading recommendations...</p>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border bg-card p-5"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Skeleton className="h-36 w-full sm:w-24 flex-shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-12" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 mx-auto mb-8 flex items-center justify-center shadow-inner">
                    <TvMinimalPlay className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">No recommendations yet</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    {isOwner ? (
                      room.participants.length < 2 ? (
                        <>
                          Invite at least one more person to generate recommendations.{' '}
                          <Button
                            variant="link"
                            onClick={handleCopyLink}
                            className="text-primary hover:text-primary/80 underline underline-offset-2 font-semibold p-0 h-auto"
                          >
                            Copy invite link
                          </Button>
                        </>
                      ) : (
                        'Click the "Generate" button above to get AI-powered series recommendations for your group!'
                      )
                    ) : (
                      'The room owner will generate recommendations when everyone has joined.'
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground px-1">
                    {recommendations.length} {recommendations.length === 1 ? 'recommendation' : 'recommendations'}{' '}
                    generated
                  </p>
                  <div className="grid gap-6">
                    {recommendations.map((recommendation) => (
                      <div
                        key={recommendation.id}
                        className="group relative rounded-xl border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row gap-6 p-6">
                          {/* Series Poster */}
                          <Button
                            variant="ghost"
                            onMouseDown={(e) => handleOpenImdb(recommendation.seriesTmdbId, e)}
                            className="flex-shrink-0 w-full sm:w-32 h-auto p-0 hover:bg-transparent"
                          >
                            {recommendation.seriesDetails?.posterPath ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w300${recommendation.seriesDetails.posterPath}`}
                                alt={`${recommendation.seriesDetails.name} poster`}
                                className="h-48 w-full sm:w-32 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
                              />
                            ) : (
                              <div className="h-48 w-full sm:w-32 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <TvMinimalPlay className="w-8 h-8 text-primary" />
                              </div>
                            )}
                          </Button>

                          {/* Series Details */}
                          <div className="flex-1 min-w-0 space-y-4">
                            <div className="space-y-2">
                              <Button
                                variant="ghost"
                                onMouseDown={(e) => handleOpenImdb(recommendation.seriesTmdbId, e)}
                                className="h-auto p-0 hover:bg-transparent justify-start"
                              >
                                <h4 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {recommendation.seriesDetails?.name || 'Loading...'}
                                </h4>
                              </Button>
                              {recommendation.seriesDetails && (
                                <div className="flex items-center gap-2">
                                  {recommendation.seriesDetails.firstAirDate && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {new Date(recommendation.seriesDetails.firstAirDate).getFullYear()}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    ★ {recommendation.seriesDetails.voteAverage.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* AI Justification */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-primary flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Why we recommend this:
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {recommendation.justification}
                              </p>
                            </div>
                          </div>

                          {/* Delete Button */}
                          {isOwner && (
                            <div className="flex sm:flex-col gap-2 sm:gap-0 justify-end sm:justify-start">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRecommendation(recommendation.id)}
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* Delete Room Confirmation Dialog */}
      <Dialog
        open={confirmDeleteDialog}
        onOpenChange={setConfirmDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="pb-4">Delete Watch Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{room.name}</span>? This
              will remove all participants and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRoom}
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
