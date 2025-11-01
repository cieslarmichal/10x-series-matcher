import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../tests/generator.ts';
import { truncateTables } from '../../../../tests/helpers/dbCleanup.ts';
import { closeTestServer, createTestContext } from '../../../../tests/helpers/testServer.ts';
import type { Database } from '../../../infrastructure/database/database.ts';
import { UserRepositoryImpl } from '../infrastructure/repositories/userRepositoryImpl.ts';

import type {
  FavoriteSeriesListResponse,
  FavoriteSeries,
  IgnoredSeriesListResponse,
  IgnoredSeries,
  LoginResponse,
  UserResponse,
} from './userSchemas.ts';

describe('User Routes Integration Tests', () => {
  let server: FastifyInstance;
  let database: Database;
  let userRepository: UserRepositoryImpl;

  beforeAll(async () => {
    const testContext = await createTestContext();
    server = testContext.server;
    database = testContext.database;
    userRepository = new UserRepositoryImpl(database);
  });

  afterAll(async () => {
    await closeTestServer();
  });

  beforeEach(async () => {
    await truncateTables(database);
  });

  describe('POST /users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      const response = await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<UserResponse>();

      expect(body).toMatchObject({
        name: userData.name,
        email: userData.email,
      });
      expect(body.id).toBeTypeOf('string');
      expect(body.createdAt).toBeTypeOf('string');

      // Verify user was created in database
      const user = await userRepository.findByEmail(userData.email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        name: Generator.firstName(),
        email: 'invalid-email',
        password: Generator.password(),
      };

      const response = await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 when email already exists', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // First registration
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Second registration with same email
      const response = await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('POST /users/login', () => {
    it('should login user and return access token', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user first
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const response = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<LoginResponse>();
      expect(body.accessToken).toBeTypeOf('string');
      expect(body.accessToken.length).toBeGreaterThan(0);

      // Verify refresh token cookie is set
      const cookies = response.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === 'refresh-token');
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie?.value).toBeTypeOf('string');
      expect(refreshTokenCookie?.value.length).toBeGreaterThan(0);
    });

    it('should return 401 for invalid credentials', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user first
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login with wrong password
      const response = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: 'wrong-password',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: Generator.email(),
          password: Generator.password(),
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /users/logout', () => {
    it('should logout user and clear refresh token cookie', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === 'refresh-token');

      // Logout
      const response = await server.inject({
        method: 'POST',
        url: '/users/logout',
        cookies: {
          'refresh-token': refreshTokenCookie?.value ?? '',
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify cookie is cleared
      const logoutCookies = response.cookies;
      const clearedCookie = logoutCookies.find((c) => c.name === 'refresh-token');
      expect(clearedCookie?.value).toBe('');
    });
  });

  describe('POST /users/refresh-token', () => {
    it('should refresh access token with valid refresh token', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === 'refresh-token');

      // Refresh token
      const response = await server.inject({
        method: 'POST',
        url: '/users/refresh-token',
        cookies: {
          'refresh-token': refreshTokenCookie?.value ?? '',
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<LoginResponse>();
      expect(body.accessToken).toBeTypeOf('string');
      expect(body.accessToken.length).toBeGreaterThan(0);

      // Verify new refresh token cookie is set
      const refreshCookies = response.cookies;
      const newRefreshTokenCookie = refreshCookies.find((c) => c.name === 'refresh-token');
      expect(newRefreshTokenCookie).toBeDefined();
      expect(newRefreshTokenCookie?.value).toBeTypeOf('string');
    });

    it('should return 401 when refresh token is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/users/refresh-token',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /users/me', () => {
    it('should return authenticated user profile', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      // Get profile
      const response = await server.inject({
        method: 'GET',
        url: '/users/me',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<UserResponse>();

      expect(body).toMatchObject({
        name: userData.name,
        email: userData.email,
      });
      expect(body.id).toBeTypeOf('string');
      expect(body.createdAt).toBeTypeOf('string');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /users/me', () => {
    it('should delete authenticated user account', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      // Delete account
      const response = await server.inject({
        method: 'DELETE',
        url: '/users/me',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify user was deleted from database
      const user = await userRepository.findByEmail(userData.email);
      expect(user).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/users/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /users/me/password', () => {
    it('should change user password', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      const newPassword = Generator.password();

      // Change password
      const response = await server.inject({
        method: 'PATCH',
        url: '/users/me/password',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: {
          oldPassword: userData.password,
          newPassword,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify new password works
      const loginWithNewPassword = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: newPassword,
        },
      });

      expect(loginWithNewPassword.statusCode).toBe(200);
    });

    it('should return 400 when old password is incorrect', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      // Try to change password with wrong old password
      const response = await server.inject({
        method: 'PATCH',
        url: '/users/me/password',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: {
          oldPassword: 'wrong-password',
          newPassword: Generator.password(),
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /users/me/favorite-series', () => {
    it('should return empty list for user with no favorites', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      // Get favorites
      const response = await server.inject({
        method: 'GET',
        url: '/users/me/favorite-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<FavoriteSeriesListResponse>();

      expect(body.data).toHaveLength(0);
      expect(body.metadata).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 0,
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users/me/favorite-series',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /users/me/favorite-series', () => {
    it('should add series to favorites', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      const seriesTmdbId = 12345;

      // Add favorite
      const response = await server.inject({
        method: 'POST',
        url: '/users/me/favorite-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<FavoriteSeries>();

      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.addedAt).toBeTypeOf('string');
      expect(new Date(body.addedAt).getTime()).toBeGreaterThan(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/users/me/favorite-series',
        payload: {
          seriesTmdbId: 12345,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /users/me/favorite-series/:seriesTmdbId', () => {
    it('should remove series from favorites', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      const seriesTmdbId = 12345;

      // Add favorite first
      await server.inject({
        method: 'POST',
        url: '/users/me/favorite-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      // Remove favorite
      const response = await server.inject({
        method: 'DELETE',
        url: `/users/me/favorite-series/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(204);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/users/me/favorite-series/12345',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /users/me/ignored-series', () => {
    it('should return empty list for user with no ignored series', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      // Get ignored series
      const response = await server.inject({
        method: 'GET',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<IgnoredSeriesListResponse>();

      expect(body.data).toHaveLength(0);
      expect(body.metadata).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 0,
      });
    });

    it('should return paginated list of ignored series', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      const seriesTmdbId1 = 12345;
      const seriesTmdbId2 = 67890;

      // Add ignored series
      await server.inject({
        method: 'POST',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId1 },
      });

      await server.inject({
        method: 'POST',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId2 },
      });

      // Get ignored series
      const response = await server.inject({
        method: 'GET',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<IgnoredSeriesListResponse>();

      expect(body.data).toHaveLength(2);
      expect(body.metadata.total).toBe(2);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId1);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users/me/ignored-series',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /users/me/ignored-series', () => {
    it('should add series to ignored list', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      const seriesTmdbId = 12345;

      // Add to ignored
      const response = await server.inject({
        method: 'POST',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<IgnoredSeries>();

      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.ignoredAt).toBeTypeOf('string');
      expect(new Date(body.ignoredAt).getTime()).toBeGreaterThan(0);
    });

    it('should return 409 when series is already ignored', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      const seriesTmdbId = 12345;

      // Add to ignored first time
      await server.inject({
        method: 'POST',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      // Try to add again
      const response = await server.inject({
        method: 'POST',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/users/me/ignored-series',
        payload: {
          seriesTmdbId: 12345,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /users/me/ignored-series/:seriesTmdbId', () => {
    it('should remove series from ignored list', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      const seriesTmdbId = 12345;

      // Add to ignored first
      await server.inject({
        method: 'POST',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      // Remove from ignored
      const response = await server.inject({
        method: 'DELETE',
        url: `/users/me/ignored-series/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify it was removed
      const getResponse = await server.inject({
        method: 'GET',
        url: '/users/me/ignored-series',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      const body = getResponse.json<IgnoredSeriesListResponse>();
      expect(body.data).toHaveLength(0);
    });

    it('should return 404 when series is not in ignored list', async () => {
      const userData = {
        name: Generator.firstName(),
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      const seriesTmdbId = 12345;

      // Try to remove without adding first
      const response = await server.inject({
        method: 'DELETE',
        url: `/users/me/ignored-series/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/users/me/ignored-series/12345',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
