import { apiRequest } from '../apiRequest';
import type {
  PublicWatchroomDetails,
  Watchroom,
  WatchroomDetails,
  WatchroomWithParticipantCount,
} from '../types/watchroom';

export const createWatchroom = async (payload: { name: string; description?: string }): Promise<Watchroom> => {
  return apiRequest<Watchroom>('/watchrooms', {
    method: 'POST',
    body: payload,
  });
};

export const getMyWatchrooms = async (): Promise<WatchroomWithParticipantCount[]> => {
  return apiRequest<WatchroomWithParticipantCount[]>('/watchrooms', {
    method: 'GET',
  });
};

export const getPublicWatchroomDetails = async (publicLinkId: string): Promise<PublicWatchroomDetails> => {
  return apiRequest<PublicWatchroomDetails>(`/watchrooms/by-link/${publicLinkId}`, {
    method: 'GET',
    requiresAuth: false,
  });
};

export const joinWatchroom = async (publicLinkId: string): Promise<Watchroom> => {
  return apiRequest<Watchroom>(`/watchrooms/by-link/${publicLinkId}/participants`, {
    method: 'POST',
  });
};

export const getWatchroomDetails = async (watchroomId: string): Promise<WatchroomDetails> => {
  return apiRequest<WatchroomDetails>(`/watchrooms/${watchroomId}`, {
    method: 'GET',
  });
};
