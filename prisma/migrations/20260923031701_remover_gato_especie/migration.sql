/*
  Warnings:

  - The values [GATO] on the enum `Especie` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Especie_new" AS ENUM ('CACHORRO');
ALTER TABLE "Pet" ALTER COLUMN "especie" TYPE "Especie_new" USING ("especie"::text::"Especie_new");
ALTER TYPE "Especie" RENAME TO "Especie_old";
ALTER TYPE "Especie_new" RENAME TO "Especie";
DROP TYPE "public"."Especie_old";
COMMIT;
