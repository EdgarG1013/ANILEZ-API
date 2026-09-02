-- CreateTable
CREATE TABLE "listas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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

    CONSTRAINT "listas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos_multimedia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lista_id" UUID NOT NULL,
    "tipo_imagen" VARCHAR(20) NOT NULL,
    "url_original" TEXT,
    "url_supabase" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recursos_multimedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listas_usuario_id_tenrai_id_medio_key" ON "listas"("usuario_id", "tenrai_id", "medio");

-- CreateIndex
CREATE INDEX "listas_usuario_id_idx" ON "listas"("usuario_id");

-- CreateIndex
CREATE INDEX "recursos_multimedia_lista_id_idx" ON "recursos_multimedia"("lista_id");

-- AddForeignKey
ALTER TABLE "listas" ADD CONSTRAINT "listas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos_multimedia" ADD CONSTRAINT "recursos_multimedia_lista_id_fkey" FOREIGN KEY ("lista_id") REFERENCES "listas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
