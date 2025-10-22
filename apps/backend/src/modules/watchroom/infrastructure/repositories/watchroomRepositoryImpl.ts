import { eq, sql, inArray } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { users, watchroomParticipants, watchrooms } from '../../../../infrastructure/database/schema.ts';
import type { CreateWatchroomData, WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export class WatchroomRepositoryImpl implements WatchroomRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async create(data: CreateWatchroomData): Promise<Watchroom> {
    const watchroomId = UuidService.generateUuid();

    await this.database.db.transaction(async (tx) => {
      await tx.insert(watchrooms).values({
        id: watchroomId,
        name: data.name,
        description: data.description ?? null,
        ownerId: data.ownerId,
        publicLinkId: data.publicLinkId,
      });

      await tx.insert(watchroomParticipants).values({
        id: UuidService.generateUuid(),
        watchroomId,
        userId: data.ownerId,
      });
    });

    const watchroom = await this.findById(watchroomId);

    if (!watchroom) {
      throw new Error('Failed to create watchroom');
    }

    return watchroom;
  }

  public async findById(watchroomId: string): Promise<Watchroom | null> {
    const [watchroomData] = await this.database.db
      .select({
        id: watchrooms.id,
        name: watchrooms.name,
        description: watchrooms.description,
        ownerId: watchrooms.ownerId,
        ownerName: users.name,
        publicLinkId: watchrooms.publicLinkId,
        createdAt: watchrooms.createdAt,
      })
      .from(watchrooms)
      .innerJoin(users, eq(watchrooms.ownerId, users.id))
      .where(eq(watchrooms.id, watchroomId))
      .limit(1);

    if (!watchroomData) {
      return null;
    }

    const participants = await this.database.db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(watchroomParticipants)
      .innerJoin(users, eq(watchroomParticipants.userId, users.id))
      .where(eq(watchroomParticipants.watchroomId, watchroomId));

    return {
      id: watchroomData.id,
      name: watchroomData.name,
      description: watchroomData.description ?? undefined,
      ownerId: watchroomData.ownerId,
      ownerName: watchroomData.ownerName,
      publicLinkId: watchroomData.publicLinkId,
      createdAt: watchroomData.createdAt,
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };
  }

  public async findByUserId(userId: string): Promise<Watchroom[]> {
    const userWatchroomIds = await this.database.db
      .select({ watchroomId: watchroomParticipants.watchroomId })
      .from(watchroomParticipants)
      .where(eq(watchroomParticipants.userId, userId));

    if (userWatchroomIds.length === 0) {
      return [];
    }

    const watchroomIds = userWatchroomIds.map((w) => w.watchroomId);

    const watchroomsData = await this.database.db
      .select({
        id: watchrooms.id,
        name: watchrooms.name,
        description: watchrooms.description,
        ownerId: watchrooms.ownerId,
        ownerName: users.name,
        publicLinkId: watchrooms.publicLinkId,
        createdAt: watchrooms.createdAt,
      })
      .from(watchrooms)
      .innerJoin(users, eq(watchrooms.ownerId, users.id))
      .where(inArray(watchrooms.id, watchroomIds));

    const allParticipants = await this.database.db
      .select({
        watchroomId: watchroomParticipants.watchroomId,
        userId: users.id,
        userName: users.name,
      })
      .from(watchroomParticipants)
      .innerJoin(users, eq(watchroomParticipants.userId, users.id))
      .where(inArray(watchroomParticipants.watchroomId, watchroomIds));

    const participantsByWatchroom = new Map<string, Array<{ id: string; name: string }>>();

    for (const participant of allParticipants) {
      if (!participantsByWatchroom.has(participant.watchroomId)) {
        participantsByWatchroom.set(participant.watchroomId, []);
      }
      participantsByWatchroom.get(participant.watchroomId)?.push({
        id: participant.userId,
        name: participant.userName,
      });
    }

    return watchroomsData.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description ?? undefined,
      ownerId: w.ownerId,
      ownerName: w.ownerName,
      publicLinkId: w.publicLinkId,
      createdAt: w.createdAt,
      participants: participantsByWatchroom.get(w.id) ?? [],
    }));
  }

  public async findByPublicLinkId(publicLinkId: string): Promise<Watchroom | null> {
    const [watchroomData] = await this.database.db
      .select({
        id: watchrooms.id,
        name: watchrooms.name,
        description: watchrooms.description,
        ownerId: watchrooms.ownerId,
        ownerName: users.name,
        publicLinkId: watchrooms.publicLinkId,
        createdAt: watchrooms.createdAt,
      })
      .from(watchrooms)
      .innerJoin(users, eq(watchrooms.ownerId, users.id))
      .where(eq(watchrooms.publicLinkId, publicLinkId))
      .limit(1);

    if (!watchroomData) {
      return null;
    }

    const participants = await this.database.db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(watchroomParticipants)
      .innerJoin(users, eq(watchroomParticipants.userId, users.id))
      .where(eq(watchroomParticipants.watchroomId, watchroomData.id));

    return {
      id: watchroomData.id,
      name: watchroomData.name,
      description: watchroomData.description ?? undefined,
      ownerId: watchroomData.ownerId,
      ownerName: watchroomData.ownerName,
      publicLinkId: watchroomData.publicLinkId,
      createdAt: watchroomData.createdAt,
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };
  }

  public async addParticipant(watchroomId: string, userId: string): Promise<void> {
    await this.database.db.insert(watchroomParticipants).values({
      id: UuidService.generateUuid(),
      watchroomId,
      userId,
    });
  }

  public async isParticipant(watchroomId: string, userId: string): Promise<boolean> {
    const [participant] = await this.database.db
      .select()
      .from(watchroomParticipants)
      .where(sql`${watchroomParticipants.watchroomId} = ${watchroomId} AND ${watchroomParticipants.userId} = ${userId}`)
      .limit(1);

    return !!participant;
  }
}
