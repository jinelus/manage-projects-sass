-- AlterTable
ALTER TABLE "users" ALTER COLUMN "avatar_url" DROP DEFAULT,
ALTER COLUMN "avatar_url" SET DATA TYPE TEXT;
