import { and, eq, gt, isNull, lt } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { oneTimeTokens } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateOneTimeTokenData,
  OneTimeTokenRepository,
} from '../../domain/repositories/oneTimeTokenRepository.ts';
import type { OneTimeToken } from '../../domain/types/oneTimeToken.ts';

export class OneTimeTokenRepositoryImpl implements OneTimeTokenRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async create(data: CreateOneTimeTokenData): Promise<OneTimeToken> {
    const id = UuidService.generateUuid();
    await this.database.db.insert(oneTimeTokens).values({
      id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      purpose: data.purpose,
      expiresAt: data.expiresAt,
    });

    const created = await this.findValidByHash(data.tokenHash, data.purpose, new Date());
    if (!created) {
      // It may be expired already if expiresAt < now, in which case we still want to return the row
      const [row] = await this.database.db.select().from(oneTimeTokens).where(eq(oneTimeTokens.id, id)).limit(1);
      if (!row) {
        throw new Error('Failed to create one-time token');
      }
      return this.map(row);
    }
    return created;
  }

  public async findValidByHash(tokenHash: string, purpose?: string, now?: Date): Promise<OneTimeToken | null> {
    const current = now ?? new Date();
    const conditions = [
      eq(oneTimeTokens.tokenHash, tokenHash),
      isNull(oneTimeTokens.usedAt),
      gt(oneTimeTokens.expiresAt, current),
    ];
    if (purpose) {
      conditions.push(eq(oneTimeTokens.purpose, purpose));
    }

    const [row] = await this.database.db
      .select()
      .from(oneTimeTokens)
      .where(and(...conditions))
      .limit(1);

    return row ? this.map(row) : null;
  }

  public async markUsed(id: string, usedAt?: Date): Promise<void> {
    const at = usedAt ?? new Date();
    await this.database.db.update(oneTimeTokens).set({ usedAt: at }).where(eq(oneTimeTokens.id, id));
  }

  public async deleteExpired(now?: Date): Promise<void> {
    const at = now ?? new Date();

    await this.database.db.delete(oneTimeTokens).where(lt(oneTimeTokens.expiresAt, at));
  }

  private map(row: typeof oneTimeTokens.$inferSelect): OneTimeToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      purpose: row.purpose,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt ?? null,
      createdAt: row.createdAt,
    };
  }
}
