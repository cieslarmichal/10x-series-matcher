import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Users, Copy, ExternalLink, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getMyWatchrooms } from '../api/queries/watchroom.ts';
import type { Watchroom } from '../api/types/watchroom.ts';
import { CreateWatchRoomModal } from '../components/CreateWatchRoomModal.tsx';
import { AuthContext } from '../context/AuthContext.tsx';

export default function WatchRoomsPage() {
  const [rooms, setRooms] = useState<Watchroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await getMyWatchrooms(page, pageSize);
      setRooms(response.data);
      setTotal(response.metadata.total);
      setTotalPages(Math.ceil(response.metadata.total / pageSize));
    } catch {
      toast.error('Failed to fetch watchrooms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleCopyLink = (publicLinkId: string) => {
    const link = `${window.location.origin}/watchrooms/public/${publicLinkId}`;
    navigator.clipboard.writeText(link);
    toast.success('Room link copied to clipboard!');
  };

  const handleOpenWatchRoom = (roomId: string) => {
    navigate(`/watchrooms/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Watch Rooms</h1>
              <p className="text-muted-foreground mt-1.5">
                Create rooms and invite friends to get AI-powered series recommendations
              </p>
            </div>
            <CreateWatchRoomModal onRoomCreated={fetchRooms} />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mx-auto flex items-center justify-center animate-pulse">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">Loading your rooms...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && rooms.length === 0 && (
            <Card className="border-2 border-dashed">
              <CardContent className="text-center py-16 px-6">
                <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No watch rooms yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Create your first room to start getting AI-powered group recommendations!
                </p>
                <CreateWatchRoomModal onRoomCreated={fetchRooms} />
              </CardContent>
            </Card>
          )}

          {/* Rooms Grid */}
          {!isLoading && rooms.length > 0 && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => {
                  const isOwner = userData?.id === room.ownerId;
                  return (
                    <Card
                      key={room.id}
                      className="flex flex-col hover:shadow-lg transition-shadow duration-300"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2.5">
                            <CardTitle className="text-xl line-clamp-1">{room.name}</CardTitle>
                            <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                              <Badge
                                variant="secondary"
                                className="shrink-0"
                              >
                                <Users className="w-3 h-3 mr-1.5" />
                                {room.participants.length} Member
                                {room.participants.length > 1 && 's'}
                              </Badge>
                              {isOwner && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0"
                                >
                                  Owner
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 mr-1.5 shrink-0" />
                              <span>
                                {new Date(room.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow pb-6">
                        {room.description ? (
                          <CardDescription className="line-clamp-2">{room.description}</CardDescription>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No description provided.</p>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="w-full flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleOpenWatchRoom(room.id)}
                            className="flex-1"
                          >
                            Open Room
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(room.publicLinkId)}
                            className="flex-1"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {rooms.length} of {total} {total === 1 ? 'room' : 'rooms'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm px-3">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
