import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(
    correo: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verificar-email?token=${token}`;

    await this.transporter.sendMail({
      from: '"Anilist" <anilist.app@gmail.com>',
      to: correo,
      subject: 'Verifica tu correo electrónico - Anilist',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Hola ${nombre}!</h2>
          <p>Gracias por registrarte en Anilist. Para completar tu registro, verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verificar correo</a>
          <p style="color: #666; font-size: 14px;">Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
          <p style="color: #666; font-size: 14px;">Este enlace expirará en 24 horas.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(
    correo: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/restablecer-password?token=${token}&correo=${encodeURIComponent(correo)}`;

    await this.transporter.sendMail({
      from: '"Anilist" <anilist.app@gmail.com>',
      to: correo,
      subject: 'Restablece tu contraseña - Anilist',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Hola ${nombre}!</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Restablecer contraseña</a>
          <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          <p style="color: #666; font-size: 14px;">Este enlace expirará en 1 hora.</p>
        </div>
      `,
    });
  }
}
