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

export interface FindWatchroomsParams {
  readonly ownerId: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AddParticipantData {
  readonly watchroomId: string;
  readonly userId: string;
}

export interface RemoveParticipantData {
  readonly watchroomId: string;
  readonly userId: string;
}

export interface IsParticipantData {
  readonly watchroomId: string;
  readonly userId: string;
}

export type WatchroomRepository = {
  create(data: CreateWatchroomData): Promise<Watchroom>;
  findOne(params: FindWatchroomParams): Promise<Watchroom | null>;
  findMany(params: FindWatchroomsParams): Promise<{ watchrooms: Watchroom[]; total: number }>;
  addParticipant(data: AddParticipantData): Promise<void>;
  removeParticipant(data: RemoveParticipantData): Promise<void>;
  isParticipant(data: IsParticipantData): Promise<boolean>;
};
