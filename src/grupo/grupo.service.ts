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

  // ─── GRUPOS ───────────────────────────────────────────────────────────────

  async obtenerGrupos(usuarioId: string) {
    const grupos = await this.prisma.grupo.findMany({
      where: { usuarioId },
      include: {
        listas: {
          include: { items: true },
          orderBy: { orden: 'asc' },
        },
        externos: true,
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
        items: l.items.map(i => ({
          clave: `${i.medio}:${i.tenraiId}`,
          medio: i.medio,
          tenraiId: i.tenraiId,
          orden: i.orden,
        })),
      })),
      externos: g.externos.map(x => ({
        clave: x.clave,
        medio: x.medio,
        tenraiId: x.tenraiId,
        titulo: x.titulo,
        img: x.img,
        tipo: x.tipo,
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
      externos: [],
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

    // Eliminar portada de Storage si existe
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

    // Eliminar portada anterior si existe
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
      include: { items: true },
      orderBy: { orden: 'asc' },
    });

    return listas.map(l => ({
      id: l.id,
      nombre: l.nombre,
      orden: l.orden,
      items: l.items.map(i => ({
        clave: `${i.medio}:${i.tenraiId}`,
        medio: i.medio,
        tenraiId: i.tenraiId,
        orden: i.orden,
      })),
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

    const count = await this.prisma.grupo_lista_items.count({
      where: { grupoListaId: listaId },
    });

    const item = await this.prisma.grupo_lista_items.create({
      data: {
        grupoListaId: listaId,
        medio: dto.medio,
        tenraiId: dto.tenraiId,
        orden: dto.orden ?? count,
      },
    });

    return {
      clave: `${item.medio}:${item.tenraiId}`,
      medio: item.medio,
      tenraiId: item.tenraiId,
      orden: item.orden,
    };
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

  // ─── EXTERNOS ─────────────────────────────────────────────────────────────

  async agregarExterno(usuarioId: string, grupoId: string, dto: AgregarItemGrupoDto) {
    const grupo = await this.prisma.grupo.findFirst({
      where: { id: grupoId, usuarioId },
    });

    if (!grupo) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    const clave = `${dto.medio}:${dto.tenraiId}`;

    const existente = await this.prisma.grupo_externos.findUnique({
      where: { grupoId_clave: { grupoId, clave } },
    });

    if (existente) {
      throw new HttpException('Este externo ya existe en el grupo', HttpStatus.CONFLICT);
    }

    const externo = await this.prisma.grupo_externos.create({
      data: {
        grupoId,
        clave,
        medio: dto.medio,
        tenraiId: dto.tenraiId,
        titulo: dto.titulo ?? '',
        img: dto.img ?? '',
        tipo: dto.tipo ?? '',
      },
    });

    return {
      clave: externo.clave,
      medio: externo.medio,
      tenraiId: externo.tenraiId,
      titulo: externo.titulo,
      img: externo.img,
      tipo: externo.tipo,
    };
  }

  async eliminarExterno(usuarioId: string, grupoId: string, clave: string) {
    const grupo = await this.prisma.grupo.findFirst({
      where: { id: grupoId, usuarioId },
    });

    if (!grupo) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.prisma.grupo_externos.deleteMany({
      where: { grupoId, clave },
    });

    return { mensaje: 'Externo eliminado' };
  }
}
