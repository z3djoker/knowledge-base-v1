ALTER TABLE "users"
ADD COLUMN "password_hash" TEXT,
ADD COLUMN "last_login_at" TIMESTAMPTZ(6),
ADD COLUMN "disabled_at" TIMESTAMPTZ(6);
