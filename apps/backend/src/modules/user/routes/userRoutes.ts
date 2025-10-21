import { Type, type Static, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import {
  createAuthenticationMiddleware,
  createParamsAuthorizationMiddleware,
} from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Config } from '../../../core/config.ts';
import type { Database } from '../../../infrastructure/database/database.ts';
import { AddFavoriteSeriesAction } from '../application/actions/addFavoriteSeriesAction.ts';
import { ChangePasswordAction } from '../application/actions/changePasswordAction.ts';
import { CreateUserAction } from '../application/actions/createUserAction.ts';
import { DeleteUserAction } from '../application/actions/deleteUserAction.ts';
import { FindUserAction } from '../application/actions/findUserAction.ts';
import { GetUserFavoriteSeriesAction } from '../application/actions/getUserFavoriteSeriesAction.ts';
import { LoginUserAction } from '../application/actions/loginUserAction.ts';
import { LogoutUserAction } from '../application/actions/logoutUserAction.ts';
import { RefreshTokenAction } from '../application/actions/refreshTokenAction.ts';
import { RemoveFavoriteSeriesAction } from '../application/actions/removeFavoriteSeriesAction.ts';
import { PasswordService } from '../application/services/passwordService.ts';
import type { User } from '../domain/types/user.ts';
import { BlacklistTokenRepositoryImpl } from '../infrastructure/repositories/blacklistTokenRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { UserRepositoryImpl } from '../infrastructure/repositories/userRepositoryImpl.ts';

const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 64 }),
  email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
  createdAt: Type.String({ format: 'date-time' }),
});

const favoriteSeriesSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  addedAt: Type.String({ format: 'date-time' }),
});

const favoriteSeriesListSchema = Type.Object({
  data: Type.Array(favoriteSeriesSchema),
  metadata: Type.Object({
    page: Type.Number(),
    pageSize: Type.Number(),
    total: Type.Number(),
  }),
});

const appEnvironment = process.env['NODE_ENV'];

export const userRoutes: FastifyPluginAsyncTypebox<{
  database: Database;
  config: Config;
  loggerService: LoggerService;
  tokenService: TokenService;
}> = async function (fastify, opts) {
  const { config, database, loggerService, tokenService } = opts;

  const mapUserToResponse = (user: User): Static<typeof userSchema> => {
    const userResponse: Static<typeof userSchema> = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };

    return userResponse;
  };

  const refreshTokenCookie = {
    name: 'refresh-token',
    config: {
      httpOnly: true,
      secure: appEnvironment !== 'development',
      sameSite: 'none' as const,
      path: '/',
      maxAge: config.token.refresh.expiresIn,
    },
  };

  const userRepository = new UserRepositoryImpl(database);
  const blacklistTokenRepository = new BlacklistTokenRepositoryImpl(database);
  const favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(database);
  const passwordService = new PasswordService(config);

  const createUserAction = new CreateUserAction(userRepository, loggerService, passwordService);
  const findUserAction = new FindUserAction(userRepository);
  const deleteUserAction = new DeleteUserAction(userRepository, loggerService);
  const loginUserAction = new LoginUserAction(userRepository, loggerService, tokenService, passwordService);
  const changePasswordAction = new ChangePasswordAction(userRepository, loggerService, passwordService);
  const refreshTokenAction = new RefreshTokenAction(
    userRepository,
    blacklistTokenRepository,
    config,
    loggerService,
    tokenService,
  );
  const logoutUserAction = new LogoutUserAction(blacklistTokenRepository, config, tokenService);
  const getUserFavoriteSeriesAction = new GetUserFavoriteSeriesAction(favoriteSeriesRepository);
  const addFavoriteSeriesAction = new AddFavoriteSeriesAction(favoriteSeriesRepository);
  const removeFavoriteSeriesAction = new RemoveFavoriteSeriesAction(favoriteSeriesRepository);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);
  const authorizationMiddleware = createParamsAuthorizationMiddleware();

  fastify.post('/users/register', {
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 64 }),
        email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
        password: Type.String({ minLength: 8, maxLength: 64 }),
      }),
      response: {
        201: userSchema,
      },
    },
    config: {
      rateLimit: config.rateLimit.auth,
    },
    handler: async (request, reply) => {
      const user = await createUserAction.execute({
        name: request.body.name,
        email: request.body.email,
        password: request.body.password,
      });

      return reply.status(201).send(mapUserToResponse(user));
    },
  });

  fastify.post('/users/login', {
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 8, maxLength: 64 }),
      }),
      response: {
        200: Type.Object({ accessToken: Type.String() }),
      },
    },
    config: {
      rateLimit: config.rateLimit.auth,
    },
    handler: async (request, reply) => {
      const { email, password } = request.body;

      const result = await loginUserAction.execute({ email, password });

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);

      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.post('/users/logout', {
    schema: {
      response: {
        204: Type.Null(),
      },
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      await logoutUserAction.execute({ refreshToken });

      reply.clearCookie(refreshTokenCookie.name, { path: refreshTokenCookie.config.path });

      return reply.status(204).send();
    },
  });

  fastify.post('/users/refresh-token', {
    schema: {
      response: {
        200: Type.Object({ accessToken: Type.String() }),
      },
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      if (!refreshToken) {
        throw new UnauthorizedAccessError({
          reason: 'Refresh token cookie not found',
        });
      }

      const result = await refreshTokenAction.execute({ refreshToken });

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);

      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.get('/users/me', {
    schema: {
      response: {
        200: userSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;

      const user = await findUserAction.execute(userId);

      return reply.send(mapUserToResponse(user));
    },
  });

  fastify.delete('/users/:userId', {
    schema: {
      params: Type.Object({
        userId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware, authorizationMiddleware],
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      const { userId } = request.params;

      await deleteUserAction.execute(userId);

      if (refreshToken) {
        reply.clearCookie(refreshTokenCookie.name, { path: refreshTokenCookie.config.path });
      }

      return reply.status(204).send();
    },
  });

  fastify.patch('/users/me/password', {
    schema: {
      body: Type.Object({
        oldPassword: Type.String(),
        newPassword: Type.String(),
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
      const { oldPassword, newPassword } = request.body;

      await changePasswordAction.execute({ userId, oldPassword, newPassword });

      return reply.status(204).send();
    },
  });

  fastify.get('/users/me/favorite-series', {
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, maximum: 500 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
      }),
      response: {
        200: favoriteSeriesListSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const { page = 1, limit = 20 } = request.query;

      const result = await getUserFavoriteSeriesAction.execute(userId, page, limit);

      return reply.send({
        data: result.favorites.map((favorite) => ({
          seriesTmdbId: favorite.seriesTmdbId,
          addedAt: favorite.addedAt.toISOString(),
        })),
        metadata: {
          page,
          pageSize: limit,
          total: result.total,
        },
      });
    },
  });

  fastify.post('/users/me/favorite-series', {
    schema: {
      body: Type.Object({
        seriesTmdbId: Type.Number({ minimum: 1 }),
      }),
      response: {
        201: favoriteSeriesSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const { seriesTmdbId } = request.body;

      const favorite = await addFavoriteSeriesAction.execute(userId, seriesTmdbId);

      return reply.status(201).send({
        seriesTmdbId: favorite.seriesTmdbId,
        addedAt: favorite.addedAt.toISOString(),
      });
    },
  });

  fastify.delete('/users/me/favorite-series/:seriesTmdbId', {
    schema: {
      params: Type.Object({
        seriesTmdbId: Type.Number({ minimum: 1 }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const { seriesTmdbId } = request.params;

      await removeFavoriteSeriesAction.execute(userId, seriesTmdbId);

      return reply.status(204).send();
    },
  });
};
