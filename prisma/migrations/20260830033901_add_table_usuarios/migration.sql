-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,
    "correo" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "avatar" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferencias" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "sfw" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "email" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "preferencias_usuario_id_key" ON "preferencias"("usuario_id");

-- AddForeignKey
ALTER TABLE "preferencias" ADD CONSTRAINT "preferencias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
