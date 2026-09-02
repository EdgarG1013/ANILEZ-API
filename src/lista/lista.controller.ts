import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtGuard } from '../autenticacion/guards/jwt-auth.guard.js';
import { ListaService } from './lista.service.js';
import { CrearListaDto } from './dto/crear-lista.dto.js';
import { ActualizarListaDto } from './dto/actualizar-lista.dto.js';

@Controller('lista')
@UseGuards(JwtGuard)
export class ListaController {
  constructor(private readonly listaService: ListaService) {}

  @Get()
  async obtenerListas(
    @Request() req: { user: { id: string } },
    @Query('medio') medio?: string,
  ) {
    return this.listaService.obtenerListas(req.user.id, medio);
  }

  @Post()
  async agregar(
    @Request() req: { user: { id: string } },
    @Body() dto: CrearListaDto,
  ) {
    return this.listaService.agregar(req.user.id, dto);
  }

  @Patch(':id')
  async actualizar(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: ActualizarListaDto,
  ) {
    return this.listaService.actualizar(req.user.id, id, dto);
  }

  @Delete(':id')
  async eliminar(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.listaService.eliminar(req.user.id, id);
  }

  @Get('estadisticas')
  async estadisticas(@Request() req: { user: { id: string } }) {
    return this.listaService.estadisticas(req.user.id);
  }
}
