import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearListaDto } from './dto/crear-lista.dto.js';
import { ActualizarListaDto } from './dto/actualizar-lista.dto.js';

// URL base de la API de Tenrai/Jikan
const JIKAN_BASE = 'https://api.tenrai.org/v1';

@Injectable()
export class ListaService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(ListaService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  /**
   * Obtener todas las listas del usuario, opcionalmente filtradas por medio
   */
  async obtenerListas(usuarioId: string, medio?: string) {
    const where: Record<string, unknown> = { usuarioId };
    if (medio) where.medio = medio;

    const listas = await this.prisma.lista.findMany({
      where,
      include: { recursos: true },
      orderBy: { orden: 'asc' },
    });

    return listas.map((l) => ({
      id: l.id,
      tenraiId: l.tenraiId,
      medio: l.medio,
      estado: l.estado,
      progreso: l.progreso,
      favorito: l.favorito,
      puntuacion: l.puntuacion,
      notas: l.notas,
      fechaInicio: l.fechaInicio,
      fechaFin: l.fechaFin,
      orden: l.orden,
      etiquetas: l.etiquetas,
      datosJson: l.datosJson,
      urlRespaldo: l.recursos[0]?.urlSupabase ?? null,
      creadoEn: l.creadoEn,
      actualizadoEn: l.actualizadoEn,
    }));
  }

  /**
   * Agregar contenido a la lista.
   * 1. Fetch de datos completos de Jikan/Tenrai
   * 2. Insert en la tabla listas
   * 3. Descarga de imagen + upload a Supabase Storage
   * 4. Registro en recursos_multimedia
   */
  async agregar(usuarioId: string, dto: CrearListaDto) {
    // Verificar que no exista ya
    const existente = await this.prisma.lista.findUnique({
      where: {
        usuarioId_tenraiId_medio: {
          usuarioId,
          tenraiId: dto.tenraiId,
          medio: dto.medio,
        },
      },
    });

    if (existente) {
      throw new HttpException('Este contenido ya está en tu lista', HttpStatus.CONFLICT);
    }

    // Fetch de datos completos de Jikan
    let datosJson: Record<string, unknown>;
    try {
      const endpoint = dto.medio === 'anime' ? 'anime' : 'manga';
      const response = await axios.get(`${JIKAN_BASE}/${endpoint}/${dto.tenraiId}`);
      datosJson = response.data?.data ?? response.data ?? {};
    } catch {
      this.logger.warn(`No se pudo obtener datos de Jikan para ${dto.medio}/${dto.tenraiId}, usando datos del catálogo`);
      datosJson = dto.datosCatalogo ?? { id: Number(dto.tenraiId) };
    }

    // Insertar en la tabla listas
    const lista = await this.prisma.lista.create({
      data: {
        usuarioId,
        tenraiId: dto.tenraiId,
        medio: dto.medio,
        estado: dto.estado,
        progreso: dto.progreso ?? 0,
        favorito: dto.favorito ?? false,
        puntuacion: dto.puntuacion ?? 0,
        notas: dto.notas,
        orden: dto.orden ?? 0,
        etiquetas: dto.etiquetas ?? [],
        datosJson: datosJson as unknown as Prisma.InputJsonValue,
      },
    });

    // Descargar y subir imagen (eager)
    let urlRespaldo: string | null = null;
    try {
      urlRespaldo = await this.descargarYSubirImagen(lista.id, dto.medio, dto.tenraiId, datosJson);
    } catch (err: unknown) {
      this.logger.error(`Error subiendo imagen para ${dto.medio}/${dto.tenraiId}: ${(err as Error).message}`);
    }

    return {
      id: lista.id,
      tenraiId: lista.tenraiId,
      medio: lista.medio,
      estado: lista.estado,
      progreso: lista.progreso,
      favorito: lista.favorito,
      puntuacion: lista.puntuacion,
      notas: lista.notas,
      fechaInicio: lista.fechaInicio,
      fechaFin: lista.fechaFin,
      orden: lista.orden,
      etiquetas: lista.etiquetas,
      datosJson: lista.datosJson,
      urlRespaldo,
      creadoEn: lista.creadoEn,
      actualizadoEn: lista.actualizadoEn,
    };
  }

  /**
   * Actualizar una entrada de la lista
   */
  async actualizar(usuarioId: string, listaId: string, dto: ActualizarListaDto) {
    const lista = await this.prisma.lista.findFirst({
      where: { id: listaId, usuarioId },
    });

    if (!lista) {
      throw new HttpException('Entrada no encontrada', HttpStatus.NOT_FOUND);
    }

    const actualizado = await this.prisma.lista.update({
      where: { id: listaId },
      data: {
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.progreso !== undefined && { progreso: dto.progreso }),
        ...(dto.favorito !== undefined && { favorito: dto.favorito }),
        ...(dto.puntuacion !== undefined && { puntuacion: dto.puntuacion }),
        ...(dto.notas !== undefined && { notas: dto.notas }),
        ...(dto.fechaInicio !== undefined && { fechaInicio: new Date(dto.fechaInicio) }),
        ...(dto.fechaFin !== undefined && { fechaFin: new Date(dto.fechaFin) }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
        ...(dto.etiquetas !== undefined && { etiquetas: dto.etiquetas }),
      },
      include: { recursos: true },
    });

    return {
      id: actualizado.id,
      tenraiId: actualizado.tenraiId,
      medio: actualizado.medio,
      estado: actualizado.estado,
      progreso: actualizado.progreso,
      favorito: actualizado.favorito,
      puntuacion: actualizado.puntuacion,
      notas: actualizado.notas,
      fechaInicio: actualizado.fechaInicio,
      fechaFin: actualizado.fechaFin,
      orden: actualizado.orden,
      etiquetas: actualizado.etiquetas,
      datosJson: actualizado.datosJson,
      urlRespaldo: actualizado.recursos[0]?.urlSupabase ?? null,
      creadoEn: actualizado.creadoEn,
      actualizadoEn: actualizado.actualizadoEn,
    };
  }

  /**
   * Eliminar una entrada de la lista
   */
  async eliminar(usuarioId: string, listaId: string) {
    const lista = await this.prisma.lista.findFirst({
      where: { id: listaId, usuarioId },
    });

    if (!lista) {
      throw new HttpException('Entrada no encontrada', HttpStatus.NOT_FOUND);
    }

    // Eliminar imágenes de Storage
    try {
      const recursos = await this.prisma.recursos_multimedia.findMany({
        where: { listaId },
      });

      for (const recurso of recursos) {
        // Extraer la ruta del archivo de la URL
        const urlParts = recurso.urlSupabase.split('/');
        const bucketIndex = urlParts.indexOf('imagenes-anime');
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await this.supabase.storage.from('imagenes-anime').remove([filePath]);
        }
      }
    } catch (err: unknown) {
      this.logger.error(`Error eliminando imágenes de Storage: ${(err as Error).message}`);
    }

    await this.prisma.lista.delete({ where: { id: listaId } });

    return { mensaje: 'Entrada eliminada' };
  }

  /**
   * Obtener estadísticas del usuario
   */
  async estadisticas(usuarioId: string) {
    const porEstado = await this.prisma.lista.groupBy({
      by: ['estado', 'medio'],
      where: { usuarioId },
      _count: true,
    });

    const total = await this.prisma.lista.count({ where: { usuarioId } });

    const favoritos = await this.prisma.lista.count({
      where: { usuarioId, favorito: true },
    });

    return { total, favoritos, porEstado };
  }

  /**
   * Descargar imagen de Jikan y subirla a Supabase Storage
   */
  private async descargarYSubirImagen(
    listaId: string,
    medio: string,
    tenraiId: string,
    datosJson: Record<string, unknown>,
  ): Promise<string | null> {
    // Extraer URL de imagen del snapshot de Jikan
    const images = (datosJson as Record<string, unknown>)?.images as Record<string, Record<string, string>> | undefined;
    const urlImagen = images?.jpg?.large_image_url
      || images?.jpg?.image_url
      || (datosJson as Record<string, unknown>)?.image_url as string
      || null;

    if (!urlImagen) return null;

    // Descargar imagen
    const response = await axios.get(urlImagen, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });

    const buffer = Buffer.from(response.data, 'binary');
    const contentType = String(response.headers['content-type'] || 'image/jpeg');
    const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';

    // Subir a Supabase Storage
    const filePath = `${medio}/${tenraiId}.${extension}`;

    const { error: uploadError } = await this.supabase.storage
      .from('imagenes-anime')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Error subiendo imagen: ${uploadError.message}`);
    }

    // Obtener URL pública
    const { data: urlData } = this.supabase.storage
      .from('imagenes-anime')
      .getPublicUrl(filePath);

    const urlSupabase = urlData.publicUrl;

    // Registrar en recursos_multimedia
    await this.prisma.recursos_multimedia.create({
      data: {
        listaId,
        tipoImagen: 'poster',
        urlOriginal: urlImagen,
        urlSupabase,
      },
    });

    return urlSupabase;
  }
}
