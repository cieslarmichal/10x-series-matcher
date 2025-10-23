import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Users, Copy, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getMyWatchrooms } from '../api/queries/watchroom';
import type { Watchroom } from '../api/types/watchroom';
import { CreateWatchRoomModal } from '../components/CreateWatchRoomModal';

export default function WatchRoomsPage() {
  const [rooms, setRooms] = useState<Watchroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const navigate = useNavigate();

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
    const link = `${window.location.origin}/room/${publicLinkId}`;
    navigator.clipboard.writeText(link);
    toast.success('Room link copied to clipboard!');
  };

  const handleJoinRoom = (roomId: string) => {
    navigate(`/watchrooms/${roomId}`);
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
            <CreateWatchRoomModal onRoomCreated={fetchRooms} />
          </div>

          {isLoading && <p>Loading...</p>}

          {!isLoading && rooms.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No watch rooms yet</h3>
              <p className="text-muted-foreground mt-2">
                Create your first room to start getting group recommendations!
              </p>
            </div>
          )}

          {!isLoading && rooms.length > 0 && (
            <>
              <div className="grid gap-4">
                {rooms.map((room) => (
                  <Card
                    key={room.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{room.name}</CardTitle>
                            <Badge
                              variant="secondary"
                              className="shrink-0 h-6"
                            >
                              <Users className="w-3.5 h-3.5 mr-1.5" />
                              <span className="font-semibold">{room.participants.length}</span>
                            </Badge>
                          </div>
                          {room.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{room.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Created{' '}
                            {new Date(room.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(room.publicLinkId)}
                          className="flex-1 sm:flex-none"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleJoinRoom(room.id)}
                          className="flex-1 sm:flex-none"
                        >
                          Open Room
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {rooms.length} of {total} rooms
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm">
                        Page {page} of {totalPages}
                      </span>
                    </div>
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
