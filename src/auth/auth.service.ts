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
import { MailService } from './mail.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // ============================================================
  // REGISTRO
  // Equivalente en Laravel: AuthController@registrarse
  // ============================================================
  async register(dto: RegisterDto) {
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
    await this.mailService.sendVerificationEmail(
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
  // LOGIN
  // Equivalente en Laravel: AuthController@login
  // ============================================================
  async login(dto: LoginDto) {
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
  async getProfile(userId: number) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: userId },
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
  async forgotPassword(dto: ForgotPasswordDto) {
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

    // El campo en Prisma se llama "email" (el modelo password_reset_tokens tiene email como PK)
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

    await this.mailService.sendPasswordResetEmail(
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
  async resetPassword(dto: ResetPasswordDto) {
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
  async logout() {
    return {
      ok: true,
      mensaje: 'Sesión cerrada exitosamente',
    };
  }
}
