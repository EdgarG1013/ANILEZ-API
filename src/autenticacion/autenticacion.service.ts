import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CorreoService } from './correo.service.js';
import { RegistrarDto } from './dto/registrar.dto.js';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import { OlvidarContrasenaDto } from './dto/olvidar-contrasena.dto.js';
import { RestablecerContrasenaDto } from './dto/restablecer-contrasena.dto.js';

@Injectable()
export class AutenticacionService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private correoService: CorreoService,
  ) {}

  // ============================================================
  // REGISTRO
  // Equivalente en Laravel: AuthController@registrarse
  // ============================================================
  async registrar(dto: RegistrarDto) {
    const existe = await this.prisma.usuarios.findUnique({
      where: { correo: dto.correo },
    });

    if (existe) {
      throw new ConflictException('Ya existe una cuenta con ese correo electrónico');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const usuario = await this.prisma.usuarios.create({
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        password: hashedPassword,
      },
    });

    await this.prisma.preferencias.create({
      data: {
        usuarioId: usuario.id,
      },
    });

    const token = this.jwtService.sign({
      sub: usuario.id,
      correo: usuario.correo,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.correoService.enviarCorreoVerificacion(
      usuario.correo,
      usuario.nombre,
      verificationToken,
    );

    return {
      ok: true,
      mensaje: 'Usuario registrado exitosamente. Por favor, verifica tu correo.',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
        },
        token,
      },
    };
  }

  // ============================================================
  // INICIAR SESIÓN
  // Equivalente en Laravel: AuthController@login
  // ============================================================
  async iniciarSesion(dto: IniciarSesionDto) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: dto.correo },
    });

    if (!usuario) {
      throw new UnauthorizedException('El correo electrónico o la contraseña son incorrectos');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.password);

    if (!passwordValido) {
      throw new UnauthorizedException('El correo electrónico o la contraseña son incorrectos');
    }

    const token = this.jwtService.sign({
      sub: usuario.id,
      correo: usuario.correo,
    });

    return {
      ok: true,
      mensaje: 'Inicio de sesión exitoso',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          avatar: usuario.avatar,
        },
        token,
      },
    };
  }

  // ============================================================
  // PERFIL (usuario autenticado)
  // Equivalente en Laravel: AuthController@usuario
  // ============================================================
  async obtenerPerfil(usuarioId: number) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        avatar: true,
        creado_en: true,
        preferencias: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      ok: true,
      data: usuario,
    };
  }

  // ============================================================
  // OLVIDÓ CONTRASEÑA
  // Equivalente en Laravel: AuthController@solicitarRestablecimiento
  // ============================================================
  async olvidarContrasena(dto: OlvidarContrasenaDto) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: dto.correo },
    });

    if (!usuario) {
      return {
        ok: true,
        mensaje: 'Si existe una cuenta con ese correo, recibirás un enlace de restablecimiento',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    await this.prisma.password_reset_tokens.upsert({
      where: { email: dto.correo },
      update: {
        token: tokenHash,
        usado: false,
      },
      create: {
        email: dto.correo,
        token: tokenHash,
      },
    });

    await this.correoService.enviarCorreoRestablecerContrasena(
      usuario.correo,
      usuario.nombre,
      token,
    );

    return {
      ok: true,
      mensaje: 'Si existe una cuenta con ese correo, recibirás un enlace de restablecimiento',
    };
  }

  // ============================================================
  // RESTABLECER CONTRASEÑA
  // Equivalente en Laravel: AuthController@restablecerContrasena
  // ============================================================
  async restablecerContrasena(dto: RestablecerContrasenaDto) {
    const resetToken = await this.prisma.password_reset_tokens.findUnique({
      where: { email: dto.correo },
    });

    if (!resetToken) {
      throw new BadRequestException('Restablecimiento inválido o expirado');
    }

    if (resetToken.usado) {
      throw new BadRequestException('Este enlace ya fue utilizado. Solicita uno nuevo');
    }

    const tokenValido = await bcrypt.compare(dto.token, resetToken.token);

    if (!tokenValido) {
      await this.prisma.password_reset_tokens.update({
        where: { email: dto.correo },
        data: { usado: true },
      });
      throw new BadRequestException('Token de restablecimiento inválido');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    await this.prisma.usuarios.update({
      where: { correo: dto.correo },
      data: { password: hashedPassword },
    });

    await this.prisma.password_reset_tokens.delete({
      where: { email: dto.correo },
    });

    return {
      ok: true,
      mensaje: 'Contraseña restablecida exitosamente',
    };
  }

  // ============================================================
  // CERRAR SESIÓN
  // Equivalente en Laravel: AuthController@logout
  // ============================================================
  async cerrarSesion() {
    return {
      ok: true,
      mensaje: 'Sesión cerrada exitosamente',
    };
  }
}
