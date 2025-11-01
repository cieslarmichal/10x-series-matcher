import { Type, type Static } from '@fastify/type-provider-typebox';

export const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 64 }),
  email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
  createdAt: Type.String({ format: 'date-time' }),
});

export const favoriteSeriesSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  addedAt: Type.String({ format: 'date-time' }),
});

export const favoriteSeriesListSchema = Type.Object({
  data: Type.Array(favoriteSeriesSchema),
  metadata: Type.Object({
    page: Type.Number(),
    pageSize: Type.Number(),
    total: Type.Number(),
  }),
});

export const ignoredSeriesSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  ignoredAt: Type.String({ format: 'date-time' }),
});

export const ignoredSeriesListSchema = Type.Object({
  data: Type.Array(ignoredSeriesSchema),
  metadata: Type.Object({
    page: Type.Number(),
    pageSize: Type.Number(),
    total: Type.Number(),
  }),
});

export const registerRequestSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 64 }),
  email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 64 }),
});

export const loginRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 64 }),
});

export const loginResponseSchema = Type.Object({
  accessToken: Type.String(),
});

export const changePasswordRequestSchema = Type.Object({
  oldPassword: Type.String(),
  newPassword: Type.String(),
});

export const addFavoriteSeriesRequestSchema = Type.Object({
  seriesTmdbId: Type.Number({ minimum: 1 }),
});

export const favoriteSeriesParamsSchema = Type.Object({
  seriesTmdbId: Type.Number({ minimum: 1 }),
});

export const favoriteSeriesQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, maximum: 500 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
});

export const addIgnoredSeriesRequestSchema = Type.Object({
  seriesTmdbId: Type.Number({ minimum: 1 }),
});

export const ignoredSeriesParamsSchema = Type.Object({
  seriesTmdbId: Type.Number({ minimum: 1 }),
});

export const ignoredSeriesQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, maximum: 500 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
});

// Export TypeScript types
export type UserResponse = Static<typeof userSchema>;
export type FavoriteSeries = Static<typeof favoriteSeriesSchema>;
export type FavoriteSeriesListResponse = Static<typeof favoriteSeriesListSchema>;
export type IgnoredSeries = Static<typeof ignoredSeriesSchema>;
export type IgnoredSeriesListResponse = Static<typeof ignoredSeriesListSchema>;
export type RegisterRequest = Static<typeof registerRequestSchema>;
export type LoginRequest = Static<typeof loginRequestSchema>;
export type LoginResponse = Static<typeof loginResponseSchema>;
export type ChangePasswordRequest = Static<typeof changePasswordRequestSchema>;
export type AddFavoriteSeriesRequest = Static<typeof addFavoriteSeriesRequestSchema>;
export type FavoriteSeriesParams = Static<typeof favoriteSeriesParamsSchema>;
export type FavoriteSeriesQuery = Static<typeof favoriteSeriesQuerySchema>;
export type AddIgnoredSeriesRequest = Static<typeof addIgnoredSeriesRequestSchema>;
export type IgnoredSeriesParams = Static<typeof ignoredSeriesParamsSchema>;
export type IgnoredSeriesQuery = Static<typeof ignoredSeriesQuerySchema>;
