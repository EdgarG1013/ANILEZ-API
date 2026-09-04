-- CreateTable
CREATE TABLE "hero_anime" (
    "id" SERIAL NOT NULL,
    "tenrai_id" INTEGER NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "titulo_ingles" VARCHAR(300),
    "puntuacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'TV',
    "anio" INTEGER NOT NULL DEFAULT 0,
    "estudio" VARCHAR(100) NOT NULL DEFAULT '',
    "episodios" INTEGER NOT NULL DEFAULT 0,
    "generos" TEXT[] NOT NULL,
    "sinopsis" TEXT NOT NULL DEFAULT '',
    "img_url" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_anime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_anime_activo_orden_idx" ON "hero_anime"("activo", "orden");
