-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "correo_pendiente" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_pendiente_key" ON "usuarios"("correo_pendiente");
