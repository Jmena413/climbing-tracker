CREATE TABLE "users" (
  "id" UUID NOT NULL, "auth_provider_id" TEXT NOT NULL, "email" TEXT NOT NULL, "display_name" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "gyms" (
  "id" UUID NOT NULL, "name" TEXT NOT NULL, "city" TEXT, "state" TEXT, "country" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sessions" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "gym_id" UUID, "started_at" TIMESTAMP(3) NOT NULL,
  "ended_at" TIMESTAMP(3), "notes" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "session_climbs" (
  "id" UUID NOT NULL, "session_id" UUID NOT NULL, "grade_system" TEXT NOT NULL, "grade_value" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL, "sent" BOOLEAN NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "session_climbs_pkey" PRIMARY KEY ("id"), CONSTRAINT "session_climbs_attempts_check" CHECK ("attempts" >= 1)
);
CREATE UNIQUE INDEX "users_auth_provider_id_key" ON "users"("auth_provider_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "sessions_user_id_started_at_idx" ON "sessions"("user_id", "started_at" DESC);
CREATE UNIQUE INDEX "sessions_one_active_per_user_idx" ON "sessions"("user_id") WHERE "ended_at" IS NULL;
CREATE INDEX "session_climbs_session_id_created_at_idx" ON "session_climbs"("session_id", "created_at");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "session_climbs" ADD CONSTRAINT "session_climbs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
