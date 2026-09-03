import {
  Controller,
  Get,
  Query,
  Param,
  Header,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CatalogoService } from './catalogo.service.js';

@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  // ─── Cache-Control header value helper ───────────────────────────────────

  private cache(sMaxAge: number, staleWhileRevalidate: number): string {
    return `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  }

  // ─── GET /api/catalogo/anime ─────────────────────────────────────────────

  @Get('anime')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')
  async buscarAnime(
    @Query('q') q?: string,
    @Query('letra') letra?: string,
    @Query('tipo') tipo?: string,
    @Query('genero') genero?: string,
    @Query('anio') anio?: string,
    @Query('temporada') temporada?: string,
    @Query('estado') estado?: string,
    @Query('orden') orden?: string,
    @Query('pagina') pagina?: string,
    @Query('sfw') sfw?: string,
  ) {
    return this.catalogoService.buscarCatalogo({
      medio: 'anime',
      q,
      letra,
      tipo,
      genero,
      anio,
      temporada,
      estado,
      orden,
      pagina: pagina ? Number(pagina) : 1,
      sfw: sfw !== 'false',
    });
  }

  // ─── GET /api/catalogo/manga ─────────────────────────────────────────────

  @Get('manga')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')
  async buscarManga(
    @Query('q') q?: string,
    @Query('letra') letra?: string,
    @Query('tipo') tipo?: string,
    @Query('genero') genero?: string,
    @Query('anio') anio?: string,
    @Query('estado') estado?: string,
    @Query('orden') orden?: string,
    @Query('pagina') pagina?: string,
    @Query('sfw') sfw?: string,
  ) {
    return this.catalogoService.buscarCatalogo({
      medio: 'manga',
      q,
      letra,
      tipo,
      genero,
      anio,
      estado,
      orden,
      pagina: pagina ? Number(pagina) : 1,
      sfw: sfw !== 'false',
    });
  }

  // ─── GET /api/catalogo/anime/:id ─────────────────────────────────────────

  @Get('anime/:id')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600')
  async detalleAnime(@Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    return this.catalogoService.obtenerDetalleAnime(numId);
  }

  // ─── GET /api/catalogo/manga/:id ─────────────────────────────────────────

  @Get('manga/:id')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600')
  async detalleManga(@Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    return this.catalogoService.obtenerDetalleManga(numId);
  }

  // ─── GET /api/catalogo/hero ──────────────────────────────────────────────

  @Get('hero')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=7200')
  async hero() {
    return this.catalogoService.obtenerHero();
  }

  // ─── GET /api/catalogo/temporada ─────────────────────────────────────────

  @Get('temporada')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')
  async enTemporada() {
    return this.catalogoService.obtenerEnTemporada();
  }

  // ─── GET /api/catalogo/top-anime ─────────────────────────────────────────

  @Get('top-anime')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')
  async topAnime() {
    return this.catalogoService.obtenerTopAnime();
  }

  // ─── GET /api/catalogo/top-manga ─────────────────────────────────────────

  @Get('top-manga')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')
  async topManga() {
    return this.catalogoService.obtenerTopManga();
  }

  // ─── GET /api/catalogo/proximos ──────────────────────────────────────────

  @Get('proximos')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')
  async proximos() {
    return this.catalogoService.obtenerProximos();
  }

  // ─── GET /api/catalogo/noticias ──────────────────────────────────────────

  @Get('noticias')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=3600')
  async noticias(@Query('cantidad') cantidad?: string) {
    return this.catalogoService.obtenerNoticias(cantidad ? Number(cantidad) : 5);
  }

  // ─── GET /api/catalogo/buscar ────────────────────────────────────────────

  @Get('buscar')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=600')
  async buscar(@Query('q') q?: string, @Query('sfw') sfw?: string) {
    if (!q || q.trim().length === 0) {
      return { anime: [], manga: [] };
    }
    return this.catalogoService.buscarGlobal(q, sfw !== 'false');
  }

  // ─── GET /api/catalogo/seasons/:year/:season ─────────────────────────────

  @Get('seasons/:year/:season')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')
  async porTemporada(
    @Param('year') year: string,
    @Param('season') season: string,
    @Query('pagina') pagina?: string,
    @Query('sfw') sfw?: string,
  ) {
    const numYear = Number(year);
    if (isNaN(numYear)) {
      throw new HttpException('Año inválido', HttpStatus.BAD_REQUEST);
    }
    return this.catalogoService.buscarPorTemporada(
      numYear,
      season,
      pagina ? Number(pagina) : 1,
      sfw !== 'false',
    );
  }

  // ─── GET /api/catalogo/:medio/:id (info básica para EstadoPage) ──────────

  @Get(':medio/:id')
  @Header('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')
  async basico(@Param('medio') medio: string, @Param('id') id: string) {
    if (medio !== 'anime' && medio !== 'manga') {
      throw new HttpException('Medio inválido', HttpStatus.BAD_REQUEST);
    }
    const numId = Number(id);
    if (isNaN(numId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    return this.catalogoService.obtenerBasico(medio, numId);
  }
}
