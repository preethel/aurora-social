-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "brand_name" TEXT,
    "account_name" TEXT,
    "currency" TEXT,
    "creator_name" TEXT,
    "posted_by" TEXT,
    "remarks" TEXT,
    "content" TEXT NOT NULL,
    "date" TEXT,
    "created_at" BIGINT NOT NULL,
    "media_type" TEXT,
    "screenshot" TEXT,
    "redirect_link" TEXT,
    "category" TEXT,
    "post_type" TEXT,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
