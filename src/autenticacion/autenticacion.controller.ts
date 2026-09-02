import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AutenticacionService } from './autenticacion.service.js';
import { RegistrarDto } from './dto/registrar.dto.js';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import { OlvidarContrasenaDto } from './dto/olvidar-contrasena.dto.js';
import { RestablecerContrasenaDto } from './dto/restablecer-contrasena.dto.js';
import { VerificarEmailDto } from './dto/verificar-email.dto.js';
import { ActualizarPreferenciasDto } from './dto/actualizar-preferencias.dto.js';
import { JwtGuard } from './guards/jwt-auth.guard.js';
import { GoogleGuard } from './guards/google.guard.js';
import { DiscordGuard } from './guards/discord.guard.js';

@Controller('auth')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  // ============================================================
  // ENDPOINTS TRADICIONALES
  // ============================================================

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

  // PATCH /auth/preferencias (protegido) — Actualizar preferencias
  @UseGuards(JwtGuard)
  @Patch('preferencias')
  actualizarPreferencias(
    @Request() req: { user: { id: string } },
    @Body() dto: ActualizarPreferenciasDto,
  ) {
    return this.autenticacionService.actualizarPreferencias(
      req.user.id,
      dto.sfw,
    );
  }

  // PATCH /auth/avatar (protegido) — Subir foto de perfil
  @UseGuards(JwtGuard)
  @Patch('avatar')
  @UseInterceptors(FileInterceptor('archivo'))
  async subirAvatar(
    @Request() req: { user: { id: string } },
    @UploadedFile() archivo: any,
  ) {
    return this.autenticacionService.subirAvatar(
      req.user.id,
      archivo.buffer,
      archivo.originalname,
      archivo.mimetype,
    );
  }

  // ============================================================
  // OAUTH — GOOGLE
  // ============================================================

  // GET /auth/google → Redirige a Google para autenticar
  @Get('google')
  @UseGuards(GoogleGuard)
  googleAuth() {
    // Passport redirige automáticamente a Google
  }

  // GET /auth/google/callback → Google redirige aquí después de autenticar
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleCallback(
    @Request() req: { user: any },
    @Res() res: Response,
  ) {
    const resultado = await this.autenticacionService.loginConProveedor({
      provider: 'google',
      providerId: req.user.providerId,
      email: req.user.email,
      nombre: req.user.nombre,
      avatar: req.user.avatar,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const token = resultado.data.token;
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  // ============================================================
  // OAUTH — DISCORD
  // ============================================================

  // GET /auth/discord → Redirige a Discord para autenticar
  @Get('discord')
  @UseGuards(DiscordGuard)
  discordAuth() {
    // Passport redirige automáticamente a Discord
  }

  // GET /auth/discord/callback → Discord redirige aquí después de autenticar
  @Get('discord/callback')
  @UseGuards(DiscordGuard)
  async discordCallback(
    @Request() req: { user: any },
    @Res() res: Response,
  ) {
    const resultado = await this.autenticacionService.loginConProveedor({
      provider: 'discord',
      providerId: req.user.providerId,
      email: req.user.email,
      nombre: req.user.nombre,
      avatar: req.user.avatar,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const token = resultado.data.token;
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
}
