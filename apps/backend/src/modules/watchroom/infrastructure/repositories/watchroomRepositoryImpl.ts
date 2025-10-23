import { eq, and, inArray, or, type SQL } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { users, watchroomParticipants, watchrooms } from '../../../../infrastructure/database/schema.ts';
import type {
  AddParticipantData,
  CreateWatchroomData,
  FindWatchroomParams,
  FindWatchroomsParams,
  IsParticipantData,
  WatchroomRepository,
} from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

interface WatchroomRow {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerName: string;
  publicLinkId: string;
  createdAt: Date;
}

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

    const watchroom = await this.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new Error('Failed to create watchroom');
    }

    return watchroom;
  }

  public async findOne(params: FindWatchroomParams): Promise<Watchroom | null> {
    const conditions: SQL[] = [];

    if (params.id) {
      conditions.push(eq(watchrooms.id, params.id));
    }

    if (params.publicLinkId) {
      conditions.push(eq(watchrooms.publicLinkId, params.publicLinkId));
    }

    if (conditions.length === 0) {
      return null;
    }

    const whereClause = conditions.length === 1 ? conditions[0] : or(...conditions);

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
      .where(whereClause)
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

    return this.mapToWatchroom(watchroomData, participants);
  }

  public async findMany(params: FindWatchroomsParams): Promise<Watchroom[]> {
    const userWatchroomIds = await this.database.db
      .select({ watchroomId: watchroomParticipants.watchroomId })
      .from(watchroomParticipants)
      .where(eq(watchroomParticipants.userId, params.ownerId));

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

    const participantsByWatchroom = this.groupParticipantsByWatchroom(allParticipants);

    return watchroomsData.map((w) => this.mapToWatchroom(w, participantsByWatchroom.get(w.id) ?? []));
  }

  public async addParticipant(data: AddParticipantData): Promise<void> {
    await this.database.db.insert(watchroomParticipants).values({
      id: UuidService.generateUuid(),
      watchroomId: data.watchroomId,
      userId: data.userId,
    });
  }

  public async isParticipant(data: IsParticipantData): Promise<boolean> {
    const [participant] = await this.database.db
      .select()
      .from(watchroomParticipants)
      .where(
        and(eq(watchroomParticipants.watchroomId, data.watchroomId), eq(watchroomParticipants.userId, data.userId)),
      )
      .limit(1);

    return !!participant;
  }

  private mapToWatchroom(watchroomData: WatchroomRow, participants: Array<{ id: string; name: string }>): Watchroom {
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

  private groupParticipantsByWatchroom(
    participants: Array<{ watchroomId: string; userId: string; userName: string }>,
  ): Map<string, Array<{ id: string; name: string }>> {
    const participantsByWatchroom = new Map<string, Array<{ id: string; name: string }>>();

    for (const participant of participants) {
      if (!participantsByWatchroom.has(participant.watchroomId)) {
        participantsByWatchroom.set(participant.watchroomId, []);
      }
      participantsByWatchroom.get(participant.watchroomId)?.push({
        id: participant.userId,
        name: participant.userName,
      });
    }

    return participantsByWatchroom;
  }
}
