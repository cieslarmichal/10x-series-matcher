CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"room_id" uuid NOT NULL,
	"series_tmdb_id" integer NOT NULL,
	"justification" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" varchar(256),
	"owner_id" uuid NOT NULL,
	"public_link_id" varchar(21),
	CONSTRAINT "rooms_public_link_id_unique" UNIQUE("public_link_id")
);
--> statement-breakpoint
CREATE TABLE "user_favorite_series" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"series_tmdb_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorite_series" ADD CONSTRAINT "user_favorite_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_recommendations_room_id" ON "recommendations" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_recommendations_series_tmdb_id" ON "recommendations" USING btree ("series_tmdb_id");--> statement-breakpoint
CREATE INDEX "idx_room_participants_room_id" ON "room_participants" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_room_participants_user_id" ON "room_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_room_participants_room_user" ON "room_participants" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_rooms_owner_id" ON "rooms" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorite_series_user_id" ON "user_favorite_series" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorite_series_user_series_tmdb_id" ON "user_favorite_series" USING btree ("user_id","series_tmdb_id");--> statement-breakpoint
CREATE INDEX "idx_blacklisted_tokens_token_hash" ON "blacklisted_tokens" USING btree ("token_hash");