import { Type, type Static, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Database } from '../../../infrastructure/database/database.ts';
import { CreateWatchroomAction } from '../application/actions/createWatchroomAction.ts';
import { FindPublicWatchroomDetailsAction } from '../application/actions/findPublicWatchroomDetailsAction.ts';
import { FindUserWatchroomsAction } from '../application/actions/findUserWatchroomsAction.ts';
import { FindWatchroomDetailsAction } from '../application/actions/findWatchroomDetailsAction.ts';
import { JoinWatchroomAction } from '../application/actions/joinWatchroomAction.ts';
import type { Watchroom } from '../domain/types/watchroom.ts';
import { WatchroomRepositoryImpl } from '../infrastructure/repositories/watchroomRepositoryImpl.ts';

const watchroomNameSchema = Type.String({ minLength: 1, maxLength: 64 });
const watchroomDescriptionSchema = Type.Optional(Type.String({ maxLength: 256 }));

const watchroomSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: watchroomNameSchema,
  description: watchroomDescriptionSchema,
  ownerId: Type.String({ format: 'uuid' }),
  publicLinkId: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
});

const participantSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
});

const watchroomDetailsSchema = Type.Intersect([
  watchroomSchema,
  Type.Object({
    participants: Type.Array(participantSchema),
  }),
]);

const watchroomWithParticipantCountSchema = Type.Intersect([
  watchroomSchema,
  Type.Object({
    participantCount: Type.Number(),
  }),
]);

const publicWatchroomDetailsSchema = Type.Object({
  name: watchroomNameSchema,
  description: watchroomDescriptionSchema,
  ownerName: Type.String(),
  participantCount: Type.Number(),
});

export const watchroomRoutes: FastifyPluginAsyncTypebox<{
  database: Database;
  tokenService: TokenService;
  loggerService: LoggerService;
}> = async function (fastify, opts) {
  const { database, tokenService, loggerService } = opts;

  const watchroomRepository = new WatchroomRepositoryImpl(database);

  const createWatchroomAction = new CreateWatchroomAction(watchroomRepository, loggerService);
  const findUserWatchroomsAction = new FindUserWatchroomsAction(watchroomRepository);
  const findPublicWatchroomDetailsAction = new FindPublicWatchroomDetailsAction(watchroomRepository);
  const joinWatchroomAction = new JoinWatchroomAction(watchroomRepository, loggerService);
  const findWatchroomDetailsAction = new FindWatchroomDetailsAction(watchroomRepository);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  const mapWatchroomToResponse = (watchroom: Watchroom): Static<typeof watchroomSchema> => {
    const response: Static<typeof watchroomSchema> = {
      id: watchroom.id,
      name: watchroom.name,
      ownerId: watchroom.ownerId,
      publicLinkId: watchroom.publicLinkId,
      createdAt: watchroom.createdAt.toISOString(),
    };

    if (watchroom.description) {
      response.description = watchroom.description;
    }

    return response;
  };

  const mapPublicWatchroomToResponse = (watchroom: Watchroom): Static<typeof publicWatchroomDetailsSchema> => {
    const response: Static<typeof publicWatchroomDetailsSchema> = {
      name: watchroom.name,
      ownerName: watchroom.ownerName,
      participantCount: watchroom.participants.length,
    };

    if (watchroom.description) {
      response.description = watchroom.description;
    }

    return response;
  };

  fastify.post('/watchrooms', {
    schema: {
      body: Type.Object({
        name: watchroomNameSchema,
        description: watchroomDescriptionSchema,
      }),
      response: {
        201: watchroomSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const userId = request.user.userId;
      const { name, description } = request.body;

      const watchroom = await createWatchroomAction.execute({
        name,
        description,
        ownerId: userId,
      });

      return reply.status(201).send(mapWatchroomToResponse(watchroom));
    },
  });

  fastify.get('/watchrooms', {
    schema: {
      response: {
        200: Type.Array(watchroomWithParticipantCountSchema),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const userId = request.user.userId;

      const watchrooms: Watchroom[] = await findUserWatchroomsAction.execute(userId);

      return reply.send(
        watchrooms.map((watchroom) => ({
          ...mapWatchroomToResponse(watchroom),
          participantCount: watchroom.participants.length,
        })),
      );
    },
  });

  fastify.get('/watchrooms/by-link/:publicLinkId', {
    schema: {
      params: Type.Object({
        publicLinkId: Type.String({ minLength: 1 }),
      }),
      response: {
        200: publicWatchroomDetailsSchema,
      },
    },
    handler: async (request, reply) => {
      const { publicLinkId } = request.params;

      const watchroom: Watchroom = await findPublicWatchroomDetailsAction.execute(publicLinkId);

      return reply.send(mapPublicWatchroomToResponse(watchroom));
    },
  });

  fastify.post('/watchrooms/by-link/:publicLinkId/participants', {
    schema: {
      params: Type.Object({
        publicLinkId: Type.String({ minLength: 1 }),
      }),
      response: {
        201: watchroomSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const { publicLinkId } = request.params;

      const watchroom = await joinWatchroomAction.execute({
        publicLinkId,
        userId,
      });

      return reply.status(201).send(mapWatchroomToResponse(watchroom));
    },
  });

  fastify.get('/watchrooms/:watchroomId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: watchroomDetailsSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { watchroomId } = request.params;

      const watchroom: Watchroom = await findWatchroomDetailsAction.execute(watchroomId);

      return reply.send({
        ...mapWatchroomToResponse(watchroom),
        participants: watchroom.participants.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      });
    },
  });
};
