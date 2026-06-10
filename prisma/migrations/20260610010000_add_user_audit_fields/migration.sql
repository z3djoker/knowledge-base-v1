ALTER TABLE "users"
ADD COLUMN "created_by_user_id" UUID,
ADD COLUMN "updated_by_user_id" UUID;

CREATE INDEX "users_created_by_user_id_idx" ON "users"("created_by_user_id");
CREATE INDEX "users_updated_by_user_id_idx" ON "users"("updated_by_user_id");

ALTER TABLE "users"
ADD CONSTRAINT "users_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users"
ADD CONSTRAINT "users_updated_by_user_id_fkey"
FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
