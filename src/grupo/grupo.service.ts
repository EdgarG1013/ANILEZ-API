import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearGrupoDto } from './dto/crear-grupo.dto.js';
import { ActualizarGrupoDto } from './dto/actualizar-grupo.dto.js';
import { CrearListaGrupoDto } from './dto/crear-lista-grupo.dto.js';
import { AgregarItemGrupoDto } from './dto/agregar-item-grupo.dto.js';

@Injectable()
export class GrupoService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(GrupoService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  private formatearItem(i: any) {
    const datos = i.lista?.datosJson ?? i.listaExterna?.datosJson ?? {};
    const images = (datos as any)?.images;
    const img = images?.jpg?.large_image_url || images?.jpg?.image_url || (datos as any)?.img || '';
    const title = (datos as any)?.title || (datos as any)?.titulo || '';
    const type = (datos as any)?.type || (datos as any)?.tipo || '';

    return {
      clave: `${i.medio}:${i.tenraiId}`,
      medio: i.medio,
      tenraiId: i.tenraiId,
      orden: i.orden,
      datosCatalogo: datos,
      titulo: title,
      img,
      tipo: type,
      esExterno: i.listaExternaId !== null,
    };
  }

  // ─── GRUPOS ───────────────────────────────────────────────────────────────

  async obtenerGrupos(usuarioId: string) {
    const grupos = await this.prisma.grupo.findMany({
      where: { usuarioId },
      include: {
        listas: {
          include: {
            items: {
              include: {
                lista: true,
                listaExterna: true,
              },
            },
          },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    return grupos.map(g => ({
      id: g.id,
      titulo: g.titulo,
      descripcion: g.descripcion,
      portadaUrl: g.portadaUrl,
      etiquetas: g.etiquetas,
      listas: g.listas.map(l => ({
        id: l.id,
        nombre: l.nombre,
        orden: l.orden,
        items: l.items.map(i => this.formatearItem(i)),
      })),
      creadoEn: g.creadoEn,
    }));
  }

  async crear(usuarioId: string, dto: CrearGrupoDto) {
    const grupo = await this.prisma.grupo.create({
      data: {
        usuarioId,
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? '',
        etiquetas: dto.etiquetas ?? [],
      },
    });

    return {
      id: grupo.id,
      titulo: grupo.titulo,
      descripcion: grupo.descripcion,
      portadaUrl: grupo.portadaUrl,
      etiquetas: grupo.etiquetas,
      listas: [],
      creadoEn: grupo.creadoEn,
    };
  }

  async actualizar(usuarioId: string, grupoId: string, dto: ActualizarGrupoDto) {
    const grupo = await this.prisma.grupo.findFirst({
      where: { id: grupoId, usuarioId },
    });

    if (!grupo) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    const actualizado = await this.prisma.grupo.update({
      where: { id: grupoId },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.etiquetas !== undefined && { etiquetas: dto.etiquetas }),
      },
    });

    return {
      id: actualizado.id,
      titulo: actualizado.titulo,
      descripcion: actualizado.descripcion,
      portadaUrl: actualizado.portadaUrl,
      etiquetas: actualizado.etiquetas,
      creadoEn: actualizado.creadoEn,
    };
  }

  async eliminar(usuarioId: string, grupoId: string) {
    const grupo = await this.prisma.grupo.findFirst({
      where: { id: grupoId, usuarioId },
    });

    if (!grupo) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    if (grupo.portadaUrl) {
      try {
        const urlParts = grupo.portadaUrl.split('/');
        const bucketIndex = urlParts.indexOf('portadas-grupos');
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await this.supabase.storage.from('portadas-grupos').remove([filePath]);
        }
      } catch (err) {
        this.logger.error(`Error eliminando portada de Storage: ${(err as Error).message}`);
      }
    }

    await this.prisma.grupo.delete({ where: { id: grupoId } });
    return { mensaje: 'Grupo eliminado' };
  }

  async subirPortada(usuarioId: string, grupoId: string, archivo: Buffer, nombreArchivo: string, contentType: string) {
    const grupo = await this.prisma.grupo.findFirst({
      where: { id: grupoId, usuarioId },
    });

    if (!grupo) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    if (grupo.portadaUrl) {
      try {
        const urlParts = grupo.portadaUrl.split('/');
        const bucketIndex = urlParts.indexOf('portadas-grupos');
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await this.supabase.storage.from('portadas-grupos').remove([filePath]);
        }
      } catch {
        // Ignorar errores al eliminar portada anterior
      }
    }

    const extension = nombreArchivo.split('.').pop() || 'jpg';
    const filePath = `${usuarioId}/${grupoId}.${extension}`;

    const { error: uploadError } = await this.supabase.storage
      .from('portadas-grupos')
      .upload(filePath, archivo, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new HttpException(`Error subiendo portada: ${uploadError.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const { data: urlData } = this.supabase.storage
      .from('portadas-grupos')
      .getPublicUrl(filePath);

    const portadaUrl = urlData.publicUrl;

    await this.prisma.grupo.update({
      where: { id: grupoId },
      data: { portadaUrl },
    });

    return { portadaUrl };
  }

  // ─── LISTAS PERSONALIZADAS ────────────────────────────────────────────────

  async obtenerListas(usuarioId: string, grupoId: string) {
    const grupo = await this.prisma.grupo.findFirst({
      where: { id: grupoId, usuarioId },
    });

    if (!grupo) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    const listas = await this.prisma.grupo_listas.findMany({
      where: { grupoId },
      include: {
        items: {
          include: {
            lista: true,
            listaExterna: true,
          },
        },
      },
      orderBy: { orden: 'asc' },
    });

    return listas.map(l => ({
      id: l.id,
      nombre: l.nombre,
      orden: l.orden,
      items: l.items.map(i => this.formatearItem(i)),
    }));
  }

  async crearLista(usuarioId: string, grupoId: string, dto: CrearListaGrupoDto) {
    const grupo = await this.prisma.grupo.findFirst({
      where: { id: grupoId, usuarioId },
    });

    if (!grupo) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    const count = await this.prisma.grupo_listas.count({
      where: { grupoId },
    });

    const lista = await this.prisma.grupo_listas.create({
      data: {
        grupoId,
        nombre: dto.nombre,
        orden: dto.orden ?? count,
      },
    });

    return { id: lista.id, nombre: lista.nombre, orden: lista.orden, items: [] };
  }

  async actualizarLista(usuarioId: string, listaId: string, data: { nombre?: string; orden?: number }) {
    const lista = await this.prisma.grupo_listas.findFirst({
      where: { id: listaId },
      include: { grupo: true },
    });

    if (!lista || lista.grupo.usuarioId !== usuarioId) {
      throw new HttpException('Lista no encontrada', HttpStatus.NOT_FOUND);
    }

    const actualizado = await this.prisma.grupo_listas.update({
      where: { id: listaId },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.orden !== undefined && { orden: data.orden }),
      },
    });

    return { id: actualizado.id, nombre: actualizado.nombre, orden: actualizado.orden };
  }

  async eliminarLista(usuarioId: string, listaId: string) {
    const lista = await this.prisma.grupo_listas.findFirst({
      where: { id: listaId },
      include: { grupo: true },
    });

    if (!lista || lista.grupo.usuarioId !== usuarioId) {
      throw new HttpException('Lista no encontrada', HttpStatus.NOT_FOUND);
    }

    await this.prisma.grupo_listas.delete({ where: { id: listaId } });
    return { mensaje: 'Lista eliminada' };
  }

  // ─── ITEMS DE LISTA ───────────────────────────────────────────────────────

  async agregarItem(usuarioId: string, listaId: string, dto: AgregarItemGrupoDto) {
    const lista = await this.prisma.grupo_listas.findFirst({
      where: { id: listaId },
      include: { grupo: true },
    });

    if (!lista || lista.grupo.usuarioId !== usuarioId) {
      throw new HttpException('Lista no encontrada', HttpStatus.NOT_FOUND);
    }

    // Verificar que no exista ya
    const existente = await this.prisma.grupo_lista_items.findUnique({
      where: {
        grupoListaId_medio_tenraiId: {
          grupoListaId: listaId,
          medio: dto.medio,
          tenraiId: dto.tenraiId,
        },
      },
    });

    if (existente) {
      throw new HttpException('Este item ya está en la lista', HttpStatus.CONFLICT);
    }

    // Buscar si el item existe en la biblioteca personal
    const listaPersonal = await this.prisma.lista.findUnique({
      where: {
        usuarioId_tenraiId_medio: {
          usuarioId,
          tenraiId: dto.tenraiId,
          medio: dto.medio,
        },
      },
    });

    let listaExternaId: string | null = null;
    let listaIdRef: string | null = null;

    if (listaPersonal) {
      // Item está en la biblioteca personal
      listaIdRef = listaPersonal.id;
    } else {
      // Item no está en la biblioteca — crear o buscar lista_externa
      const existenteExterno = await this.prisma.lista_externa.findUnique({
        where: {
          usuarioId_tenraiId_medio: {
            usuarioId,
            tenraiId: dto.tenraiId,
            medio: dto.medio,
          },
        },
      });

      if (existenteExterno) {
        listaExternaId = existenteExterno.id;
      } else {
        const nuevaExterna = await this.prisma.lista_externa.create({
          data: {
            usuarioId,
            tenraiId: dto.tenraiId,
            medio: dto.medio,
            estado: 'por-ver',
            datosJson: (dto.datosCatalogo ?? {}) as any,
          },
        });
        listaExternaId = nuevaExterna.id;
      }
    }

    const count = await this.prisma.grupo_lista_items.count({
      where: { grupoListaId: listaId },
    });

    const item = await this.prisma.grupo_lista_items.create({
      data: {
        grupoListaId: listaId,
        listaId: listaIdRef,
        listaExternaId,
        medio: dto.medio,
        tenraiId: dto.tenraiId,
        orden: dto.orden ?? count,
      },
      include: {
        lista: true,
        listaExterna: true,
      },
    });

    return this.formatearItem(item);
  }

  async eliminarItem(usuarioId: string, listaId: string, medio: string, tenraiId: string) {
    const lista = await this.prisma.grupo_listas.findFirst({
      where: { id: listaId },
      include: { grupo: true },
    });

    if (!lista || lista.grupo.usuarioId !== usuarioId) {
      throw new HttpException('Lista no encontrada', HttpStatus.NOT_FOUND);
    }

    await this.prisma.grupo_lista_items.deleteMany({
      where: { grupoListaId: listaId, medio, tenraiId },
    });

    return { mensaje: 'Item eliminado' };
  }

  async reordenarItems(usuarioId: string, listaId: string, items: { medio: string; tenraiId: string }[]) {
    const lista = await this.prisma.grupo_listas.findFirst({
      where: { id: listaId },
      include: { grupo: true },
    });

    if (!lista || lista.grupo.usuarioId !== usuarioId) {
      throw new HttpException('Lista no encontrada', HttpStatus.NOT_FOUND);
    }

    // Obtener items actuales para preservar sus FKs
    const itemsActuales = await this.prisma.grupo_lista_items.findMany({
      where: { grupoListaId: listaId },
    });

    const fkMap = new Map<string, { listaId: string | null; listaExternaId: string | null }>();
    for (const item of itemsActuales) {
      fkMap.set(`${item.medio}:${item.tenraiId}`, {
        listaId: item.listaId,
        listaExternaId: item.listaExternaId,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.grupo_lista_items.deleteMany({ where: { grupoListaId: listaId } });

      if (items.length > 0) {
        await tx.grupo_lista_items.createMany({
          data: items.map((item, i) => {
            const fks = fkMap.get(`${item.medio}:${item.tenraiId}`) ?? { listaId: null, listaExternaId: null };
            return {
              grupoListaId: listaId,
              listaId: fks.listaId ?? null,
              listaExternaId: fks.listaExternaId ?? null,
              medio: item.medio,
              tenraiId: item.tenraiId,
              orden: i,
            };
          }),
        });
      }
    });

    const actualizados = await this.prisma.grupo_lista_items.findMany({
      where: { grupoListaId: listaId },
      include: {
        lista: true,
        listaExterna: true,
      },
      orderBy: { orden: 'asc' },
    });

    return actualizados.map(i => this.formatearItem(i));
  }
}
