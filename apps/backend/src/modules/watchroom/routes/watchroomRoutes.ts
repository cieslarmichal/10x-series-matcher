import { Type, type Static, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Database } from '../../../infrastructure/database/database.ts';
import { CreateWatchroomAction } from '../application/actions/createWatchroomAction.ts';
import { DeleteWatchroomAction } from '../application/actions/deleteWatchroomAction.ts';
import { FindPublicWatchroomDetailsAction } from '../application/actions/findPublicWatchroomDetailsAction.ts';
import { FindUserWatchroomsAction } from '../application/actions/findUserWatchroomsAction.ts';
import { FindWatchroomDetailsAction } from '../application/actions/findWatchroomDetailsAction.ts';
import { JoinWatchroomAction } from '../application/actions/joinWatchroomAction.ts';
import { LeaveWatchroomAction } from '../application/actions/leaveWatchroomAction.ts';
import { RemoveParticipantAction } from '../application/actions/removeParticipantAction.ts';
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
  participants: Type.Array(
    Type.Object({
      id: Type.String({ format: 'uuid' }),
      name: Type.String(),
    }),
  ),
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
  const deleteWatchroomAction = new DeleteWatchroomAction(watchroomRepository, loggerService);
  const removeParticipantAction = new RemoveParticipantAction(watchroomRepository, loggerService);
  const leaveWatchroomAction = new LeaveWatchroomAction(watchroomRepository, loggerService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  const mapWatchroomToResponse = (watchroom: Watchroom): Static<typeof watchroomSchema> => {
    const response: Static<typeof watchroomSchema> = {
      id: watchroom.id,
      name: watchroom.name,
      ownerId: watchroom.ownerId,
      publicLinkId: watchroom.publicLinkId,
      createdAt: watchroom.createdAt.toISOString(),
      participants: watchroom.participants,
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

      const { userId } = request.user;
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
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1 })),
        pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
      }),
      response: {
        200: Type.Object({
          data: Type.Array(watchroomSchema),
          metadata: Type.Object({
            page: Type.Integer(),
            pageSize: Type.Integer(),
            total: Type.Integer(),
          }),
        }),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { page = 1, pageSize = 20 } = request.query;

      const result = await findUserWatchroomsAction.execute({
        userId,
        page,
        pageSize,
      });

      return reply.send({
        data: result.data.map(mapWatchroomToResponse),
        metadata: {
          page,
          pageSize,
          total: result.total,
        },
      });
    },
  });

  fastify.get('/watchrooms/by-link/:publicLinkId', {
    schema: {
      params: Type.Object({
        publicLinkId: Type.String({ minLength: 1 }),
      }),
      response: {
        200: watchroomSchema,
      },
    },
    handler: async (request, reply) => {
      const { publicLinkId } = request.params;

      const watchroom = await findPublicWatchroomDetailsAction.execute(publicLinkId);

      return reply.send(mapWatchroomToResponse(watchroom));
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
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
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
        200: watchroomSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { watchroomId } = request.params;
      const { userId } = request.user;

      const watchroom = await findWatchroomDetailsAction.execute({ watchroomId, userId });

      return reply.send(mapWatchroomToResponse(watchroom));
    },
  });

  fastify.delete('/watchrooms/:watchroomId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { watchroomId } = request.params;
      const { userId } = request.user;

      await deleteWatchroomAction.execute({
        watchroomId,
        userId,
      });

      return reply.status(204).send();
    },
  });

  fastify.delete('/watchrooms/:watchroomId/participants/:participantId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
        participantId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const requesterId = request.user.userId;
      const { watchroomId, participantId } = request.params;

      await removeParticipantAction.execute({
        watchroomId,
        participantId,
        requesterId,
      });

      return reply.status(204).send();
    },
  });

  fastify.post('/watchrooms/:watchroomId/leave', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { watchroomId } = request.params;

      await leaveWatchroomAction.execute({
        watchroomId,
        userId,
      });

      return reply.status(204).send();
    },
  });
};
