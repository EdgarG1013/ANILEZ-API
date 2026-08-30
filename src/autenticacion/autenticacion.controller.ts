import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AutenticacionService } from './autenticacion.service.js';
import { RegistrarDto } from './dto/registrar.dto.js';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import { OlvidarContrasenaDto } from './dto/olvidar-contrasena.dto.js';
import { RestablecerContrasenaDto } from './dto/restablecer-contrasena.dto.js';
import { VerificarEmailDto } from './dto/verificar-email.dto.js';
import { JwtGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  // POST /auth/registrar
  @Post('registrar')
  registrar(@Body() dto: RegistrarDto) {
    return this.autenticacionService.registrar(dto);
  }

  // POST /auth/verificar-email
  @Post('verificar-email')
  @HttpCode(HttpStatus.OK)
  verificarEmail(@Body() dto: VerificarEmailDto) {
    return this.autenticacionService.verificarEmail(dto.token);
  }

  // POST /auth/iniciar-sesion
  @Post('iniciar-sesion')
  @HttpCode(HttpStatus.OK)
  iniciarSesion(@Body() dto: IniciarSesionDto) {
    return this.autenticacionService.iniciarSesion(dto);
  }

  // GET /auth/perfil (protegido)
  @UseGuards(JwtGuard)
  @Get('perfil')
  obtenerPerfil(@Request() req: { user: { id: string } }) {
    return this.autenticacionService.obtenerPerfil(req.user.id);
  }

  // POST /auth/olvidar-contrasena
  @Post('olvidar-contrasena')
  @HttpCode(HttpStatus.OK)
  olvidarContrasena(@Body() dto: OlvidarContrasenaDto) {
    return this.autenticacionService.olvidarContrasena(dto);
  }

  // POST /auth/restablecer-contrasena
  @Post('restablecer-contrasena')
  @HttpCode(HttpStatus.OK)
  restablecerContrasena(@Body() dto: RestablecerContrasenaDto) {
    return this.autenticacionService.restablecerContrasena(dto);
  }

  // POST /auth/cerrar-sesion (protegido)
  @UseGuards(JwtGuard)
  @Post('cerrar-sesion')
  @HttpCode(HttpStatus.OK)
  cerrarSesion() {
    return this.autenticacionService.cerrarSesion();
  }
}
