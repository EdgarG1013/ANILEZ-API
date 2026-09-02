import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../autenticacion/guards/jwt-auth.guard.js';
import { GrupoService } from './grupo.service.js';
import { CrearGrupoDto } from './dto/crear-grupo.dto.js';
import { ActualizarGrupoDto } from './dto/actualizar-grupo.dto.js';
import { CrearListaGrupoDto } from './dto/crear-lista-grupo.dto.js';
import { AgregarItemGrupoDto } from './dto/agregar-item-grupo.dto.js';

@Controller('grupo')
@UseGuards(JwtGuard)
export class GrupoController {
  constructor(private readonly grupoService: GrupoService) {}

  // ─── GRUPOS ─────────────────────────────────────────────────────────────

  @Get()
  async obtenerGrupos(@Request() req: { user: { id: string } }) {
    return this.grupoService.obtenerGrupos(req.user.id);
  }

  @Post()
  async crear(
    @Request() req: { user: { id: string } },
    @Body() dto: CrearGrupoDto,
  ) {
    return this.grupoService.crear(req.user.id, dto);
  }

  @Patch(':id')
  async actualizar(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: ActualizarGrupoDto,
  ) {
    return this.grupoService.actualizar(req.user.id, id, dto);
  }

  @Delete(':id')
  async eliminar(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.grupoService.eliminar(req.user.id, id);
  }

  @Post(':id/portada')
  @UseInterceptors(FileInterceptor('archivo'))
  async subirPortada(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @UploadedFile() archivo: any,
  ) {
    return this.grupoService.subirPortada(
      req.user.id,
      id,
      archivo.buffer,
      archivo.originalname,
      archivo.mimetype,
    );
  }

  // ─── LISTAS PERSONALIZADAS ──────────────────────────────────────────────

  @Get(':id/listas')
  async obtenerListas(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.grupoService.obtenerListas(req.user.id, id);
  }

  @Post(':id/listas')
  async crearLista(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CrearListaGrupoDto,
  ) {
    return this.grupoService.crearLista(req.user.id, id, dto);
  }

  @Patch('listas/:listaId')
  async actualizarLista(
    @Request() req: { user: { id: string } },
    @Param('listaId') listaId: string,
    @Body() data: { nombre?: string; orden?: number },
  ) {
    return this.grupoService.actualizarLista(req.user.id, listaId, data);
  }

  @Delete('listas/:listaId')
  async eliminarLista(
    @Request() req: { user: { id: string } },
    @Param('listaId') listaId: string,
  ) {
    return this.grupoService.eliminarLista(req.user.id, listaId);
  }

  // ─── ITEMS DE LISTA ─────────────────────────────────────────────────────

  @Post('listas/:listaId/items')
  async agregarItem(
    @Request() req: { user: { id: string } },
    @Param('listaId') listaId: string,
    @Body() dto: AgregarItemGrupoDto,
  ) {
    return this.grupoService.agregarItem(req.user.id, listaId, dto);
  }

  @Delete('listas/:listaId/items/:medio/:tenraiId')
  async eliminarItem(
    @Request() req: { user: { id: string } },
    @Param('listaId') listaId: string,
    @Param('medio') medio: string,
    @Param('tenraiId') tenraiId: string,
  ) {
    return this.grupoService.eliminarItem(req.user.id, listaId, medio, tenraiId);
  }

  // ─── EXTERNOS ───────────────────────────────────────────────────────────

  @Post(':id/externos')
  async agregarExterno(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: AgregarItemGrupoDto,
  ) {
    return this.grupoService.agregarExterno(req.user.id, id, dto);
  }

  @Delete(':id/externos/:clave')
  async eliminarExterno(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('clave') clave: string,
  ) {
    return this.grupoService.eliminarExterno(req.user.id, id, clave);
  }
}
