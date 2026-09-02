import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CorreoService } from './correo.service.js';
import { RegistrarDto } from './dto/registrar.dto.js';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import { OlvidarContrasenaDto } from './dto/olvidar-contrasena.dto.js';
import { RestablecerContrasenaDto } from './dto/restablecer-contrasena.dto.js';
import { hashToken, unhashToken } from './utils/token.util.js';

@Injectable()
export class AutenticacionService {
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private correoService: CorreoService,
    private config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  // ============================================================
  // REGISTRO (con envío de correo de verificación)
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

    // Generar token de verificación y enviar correo
    const verificationToken = hashToken(usuario.correo);
    try {
      await this.correoService.enviarCorreoVerificacion(
        usuario.correo,
        usuario.nombre,
        verificationToken,
      );
    } catch {
      // Si falla el envío, el usuario igual se registra
    }

    return {
      ok: true,
      mensaje: 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico.',
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
  // VERIFICAR EMAIL
  // ============================================================
  async verificarEmail(token: string) {
    const email = unhashToken(token);

    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: email },
    });

    if (!usuario) {
      throw new BadRequestException('Token de verificación inválido');
    }

    if (usuario.email_verificado_en) {
      return {
        ok: true,
        mensaje: 'El correo ya fue verificado anteriormente',
      };
    }

    await this.prisma.usuarios.update({
      where: { id: usuario.id },
      data: { email_verificado_en: new Date() },
    });

    return {
      ok: true,
      mensaje: 'Correo electrónico verificado exitosamente',
    };
  }

  // ============================================================
  // INICIAR SESIÓN (requiere email verificado)
  // ============================================================
  async iniciarSesion(dto: IniciarSesionDto) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: dto.correo },
    });

    if (!usuario) {
      throw new UnauthorizedException('El correo electrónico o la contraseña son incorrectos');
    }

    if (!usuario.password) {
      throw new UnauthorizedException('Esta cuenta fue creada con un proveedor externo. Usa Google o Discord para iniciar sesión.');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.password);

    if (!passwordValido) {
      throw new UnauthorizedException('El correo electrónico o la contraseña son incorrectos');
    }

    if (!usuario.email_verificado_en) {
      throw new UnauthorizedException('Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
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
  // ============================================================
  async obtenerPerfil(usuarioId: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        avatar: true,
        email_verificado_en: true,
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
  // OLVIDÓ CONTRASEÑA (genera token y envía correo)
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

    try {
      await this.correoService.enviarCorreoRestablecerContrasena(
        usuario.correo,
        usuario.nombre,
        token,
      );
    } catch {
      return {
        ok: true,
        mensaje: 'Si existe una cuenta con ese correo, recibirás un enlace de restablecimiento',
        data: { token },
      };
    }

    return {
      ok: true,
      mensaje: 'Si existe una cuenta con ese correo, recibirás un enlace de restablecimiento',
    };
  }

  // ============================================================
  // RESTABLECER CONTRASEÑA
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
  // ============================================================
  async cerrarSesion() {
    return {
      ok: true,
      mensaje: 'Sesión cerrada exitosamente',
    };
  }

  // ============================================================
  // LOGIN CON PROVEEDOR (Google / Discord)
  // ============================================================
  async loginConProveedor(profile: {
    provider: 'google' | 'discord';
    providerId: string;
    email: string | null;
    nombre: string;
    avatar: string | null;
  }) {
    const { provider, providerId, email, nombre, avatar } = profile;

    // 1. Buscar por provider_id
    const whereClause =
      provider === 'google'
        ? { google_id: providerId }
        : { discord_id: providerId };

    let usuario = await this.prisma.usuarios.findFirst({
      where: whereClause,
    });

    // 2. Si no existe, buscar por correo
    if (!usuario && email) {
      usuario = await this.prisma.usuarios.findUnique({
        where: { correo: email },
      });

      // Vincular la cuenta existente al proveedor
      if (usuario) {
        const updateData: Record<string, unknown> =
          provider === 'google'
            ? { google_id: providerId }
            : { discord_id: providerId };

        if (avatar && !usuario.avatar) {
          updateData.avatar = avatar;
        }

        usuario = await this.prisma.usuarios.update({
          where: { id: usuario.id },
          data: updateData,
        });
      }
    }

    // 3. Si no existe, crear usuario nuevo
    if (!usuario) {
      if (!email) {
        throw new BadRequestException(
          `No se pudo obtener el correo electrónico de ${provider}. Asegúrate de tener un correo asociado.`,
        );
      }

      usuario = await this.prisma.usuarios.create({
        data: {
          nombre,
          correo: email,
          avatar,
          google_id: provider === 'google' ? providerId : undefined,
          discord_id: provider === 'discord' ? providerId : undefined,
          email_verificado_en: new Date(),
        },
      });

      await this.prisma.preferencias.create({
        data: { usuarioId: usuario.id },
      });
    }

    // 4. Generar JWT
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
  // ACTUALIZAR PREFERENCIAS
  // ============================================================
  async actualizarPreferencias(usuarioId: string, sfw?: boolean) {
    const updateData: Record<string, unknown> = {};
    if (sfw !== undefined) updateData.sfw = sfw;

    const preferencias = await this.prisma.preferencias.upsert({
      where: { usuarioId },
      update: updateData,
      create: { usuarioId, sfw: sfw ?? true },
    });

    return {
      ok: true,
      preferencias,
    };
  }

  // ============================================================
  // SUBIR AVATAR
  // ============================================================
  async subirAvatar(usuarioId: string, archivo: Buffer, nombreArchivo: string, contentType: string) {
    // Eliminar avatar anterior si existe
    const usuario = await this.prisma.usuarios.findUnique({ where: { id: usuarioId } });
    if (usuario?.avatar) {
      try {
        const urlParts = usuario.avatar.split('/');
        const bucketIndex = urlParts.indexOf('avatars');
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await this.supabase.storage.from('avatars').remove([filePath]);
        }
      } catch {
        // Ignorar errores al eliminar avatar anterior
      }
    }

    const extension = nombreArchivo.split('.').pop() || 'jpg';
    const filePath = `${usuarioId}.${extension}`;

    const { error: uploadError } = await this.supabase.storage
      .from('avatars')
      .upload(filePath, archivo, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new InternalServerErrorException(`Error subiendo avatar: ${uploadError.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    await this.prisma.usuarios.update({
      where: { id: usuarioId },
      data: { avatar: avatarUrl },
    });

    return {
      ok: true,
      avatar: `${avatarUrl}?t=${Date.now()}`,
    };
  }
}
