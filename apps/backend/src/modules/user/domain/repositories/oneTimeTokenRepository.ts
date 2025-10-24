import type { OneTimeToken } from '../types/oneTimeToken.ts';

export interface CreateOneTimeTokenData {
  readonly userId: string;
  readonly tokenHash: string;
  readonly purpose: string;
  readonly expiresAt: Date;
}

export interface OneTimeTokenRepository {
  create(data: CreateOneTimeTokenData): Promise<OneTimeToken>;
  findValidByHash(tokenHash: string, purpose?: string, now?: Date): Promise<OneTimeToken | null>;
  markUsed(id: string, usedAt?: Date): Promise<void>;
  deleteExpired(now?: Date): Promise<void>;
}
