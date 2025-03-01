-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL,
ALTER COLUMN "avatar_url" DROP NOT NULL;
