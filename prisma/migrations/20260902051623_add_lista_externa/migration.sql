-- CreateTable
CREATE TABLE "lista_externa" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tenrai_id" VARCHAR(50) NOT NULL,
    "medio" VARCHAR(10) NOT NULL,
    "estado" VARCHAR(20) NOT NULL,
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "favorito" BOOLEAN NOT NULL DEFAULT false,
    "puntuacion" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "etiquetas" TEXT[],
    "datos_json" JSONB NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lista_externa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurso_multimedia_externo" (
    "id" UUID NOT NULL,
    "lista_externa_id" UUID NOT NULL,
    "tipo_imagen" VARCHAR(20) NOT NULL,
    "url_original" TEXT,
    "url_supabase" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurso_multimedia_externo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "portada_url" TEXT,
    "etiquetas" TEXT[],
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_listas" (
    "id" UUID NOT NULL,
    "grupo_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grupo_listas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_lista_items" (
    "id" UUID NOT NULL,
    "grupo_lista_id" UUID NOT NULL,
    "lista_id" UUID,
    "lista_externa_id" UUID,
    "medio" VARCHAR(10) NOT NULL,
    "tenrai_id" VARCHAR(50) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grupo_lista_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lista_externa_usuario_id_idx" ON "lista_externa"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "lista_externa_usuario_id_tenrai_id_medio_key" ON "lista_externa"("usuario_id", "tenrai_id", "medio");

-- CreateIndex
CREATE INDEX "recurso_multimedia_externo_lista_externa_id_idx" ON "recurso_multimedia_externo"("lista_externa_id");

-- CreateIndex
CREATE INDEX "grupos_usuario_id_idx" ON "grupos"("usuario_id");

-- CreateIndex
CREATE INDEX "grupo_listas_grupo_id_idx" ON "grupo_listas"("grupo_id");

-- CreateIndex
CREATE INDEX "grupo_lista_items_grupo_lista_id_idx" ON "grupo_lista_items"("grupo_lista_id");

-- CreateIndex
CREATE INDEX "grupo_lista_items_lista_id_idx" ON "grupo_lista_items"("lista_id");

-- CreateIndex
CREATE INDEX "grupo_lista_items_lista_externa_id_idx" ON "grupo_lista_items"("lista_externa_id");

-- CreateIndex
CREATE UNIQUE INDEX "grupo_lista_items_grupo_lista_id_medio_tenrai_id_key" ON "grupo_lista_items"("grupo_lista_id", "medio", "tenrai_id");

-- AddForeignKey
ALTER TABLE "lista_externa" ADD CONSTRAINT "lista_externa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso_multimedia_externo" ADD CONSTRAINT "recurso_multimedia_externo_lista_externa_id_fkey" FOREIGN KEY ("lista_externa_id") REFERENCES "lista_externa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_listas" ADD CONSTRAINT "grupo_listas_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_lista_items" ADD CONSTRAINT "grupo_lista_items_grupo_lista_id_fkey" FOREIGN KEY ("grupo_lista_id") REFERENCES "grupo_listas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_lista_items" ADD CONSTRAINT "grupo_lista_items_lista_id_fkey" FOREIGN KEY ("lista_id") REFERENCES "listas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_lista_items" ADD CONSTRAINT "grupo_lista_items_lista_externa_id_fkey" FOREIGN KEY ("lista_externa_id") REFERENCES "lista_externa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
