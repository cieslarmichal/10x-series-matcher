import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const blacklistedTokens = pgTable(
  'blacklisted_tokens',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [index('idx_blacklisted_tokens_token_hash').on(table.tokenHash)],
);

export const userFavoriteSeries = pgTable(
  'user_favorite_series',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_user_favorite_series_user_id').on(table.userId),
    index('idx_user_favorite_series_user_series_tmdb_id').on(table.userId, table.seriesTmdbId),
  ],
);

export const watchrooms = pgTable(
  'watchrooms',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 64 }).notNull(),
    description: varchar('description', { length: 256 }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    publicLinkId: varchar('public_link_id', { length: 21 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_watchrooms_owner_id').on(table.ownerId)],
);

export const watchroomParticipants = pgTable(
  'watchroom_participants',
  {
    id: uuid('id').primaryKey(),
    watchroomId: uuid('watchroom_id')
      .notNull()
      .references(() => watchrooms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_watchroom_participants_watchroom_id').on(table.watchroomId),
    index('idx_watchroom_participants_user_id').on(table.userId),
    index('idx_watchroom_participants_watchroom_user').on(table.watchroomId, table.userId),
  ],
);

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey(),
    watchroomId: uuid('watchroom_id')
      .notNull()
      .references(() => watchrooms.id, { onDelete: 'cascade' }),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
    justification: text('justification').notNull(),
  },
  (table) => [
    index('idx_recommendations_watchroom_id').on(table.watchroomId),
    index('idx_recommendations_series_tmdb_id').on(table.seriesTmdbId),
  ],
);
