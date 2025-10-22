import type { Watchroom } from '../types/watchroom.ts';

export interface CreateWatchroomData {
  readonly name: string;
  readonly description?: string | undefined;
  readonly ownerId: string;
  readonly publicLinkId: string;
}

export type WatchroomRepository = {
  create(data: CreateWatchroomData): Promise<Watchroom>;
  findById(watchroomId: string): Promise<Watchroom | null>;
  findByUserId(userId: string): Promise<Watchroom[]>;
  findByPublicLinkId(publicLinkId: string): Promise<Watchroom | null>;
  addParticipant(watchroomId: string, userId: string): Promise<void>;
  isParticipant(watchroomId: string, userId: string): Promise<boolean>;
};
