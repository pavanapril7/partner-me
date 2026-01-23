-- CreateEnum
CREATE TYPE "ImageVariantType" AS ENUM ('THUMBNAIL', 'MEDIUM', 'FULL');

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "businessIdeaId" TEXT,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_variants" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "variant" "ImageVariantType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "images_storagePath_key" ON "images"("storagePath");

-- CreateIndex
CREATE INDEX "images_businessIdeaId_order_idx" ON "images"("businessIdeaId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "image_variants_storagePath_key" ON "image_variants"("storagePath");

-- CreateIndex
CREATE UNIQUE INDEX "image_variants_imageId_variant_key" ON "image_variants"("imageId", "variant");

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_businessIdeaId_fkey" FOREIGN KEY ("businessIdeaId") REFERENCES "business_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_variants" ADD CONSTRAINT "image_variants_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
