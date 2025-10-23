import type { Watchroom } from '../types/watchroom.ts';

export interface CreateWatchroomData {
  readonly name: string;
  readonly description?: string | undefined;
  readonly ownerId: string;
  readonly publicLinkId: string;
}

export interface FindWatchroomParams {
  readonly id?: string | undefined;
  readonly publicLinkId?: string | undefined;
}

export type WatchroomRepository = {
  create(data: CreateWatchroomData): Promise<Watchroom>;
  findOne(params: FindWatchroomParams): Promise<Watchroom | null>;
  findMany(userId: string, page: number, pageSize: number): Promise<Watchroom[]>;
  count(userId: string): Promise<number>;
  addParticipant(watchroomId: string, userId: string): Promise<void>;
  removeParticipant(watchroomId: string, userId: string): Promise<void>;
  isParticipant(watchroomId: string, userId: string): Promise<boolean>;
};
