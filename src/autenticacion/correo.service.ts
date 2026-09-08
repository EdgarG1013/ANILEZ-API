import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class CorreoService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(CorreoService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async enviarCorreoVerificacion(
    correo: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verificar-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"ANILEZ" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
        to: correo,
        subject: 'Verifica tu correo electrónico - ANILEZ',
        html: `
          <!DOCTYPE html>
            <html lang="es">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verificar Email</title>
            </head>

            <body
                style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0912;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0912; padding: 40px 0;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0"
                                style="background-color: #110f1a; border: 1px solid #2a2140; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(148, 110, 217, 0.15);">
                                <!-- Header -->
                                <tr>
                                    <td
                                        style="background: linear-gradient(rgba(10, 9, 16, 0.7), rgba(10, 9, 16, 0.7)), url('https://res.cloudinary.com/dkggojses/image/upload/v1788139948/bg-emails_zxm0r6.png'); background-size: cover; background-position: center; padding: 80px 60px; text-align: center;">
                                        <img src="https://res.cloudinary.com/dkggojses/image/upload/v1788755301/logo_fwuv5m.svg"
                                        alt="ANILEZ" width="220"
                                            style="display: inline-block; max-width: 220px; height: auto;">
                                    </td>
                                </tr>

                                <!-- Contenido -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2
                                            style="margin: 0 0 20px; color: #f4f2fa; font-family: 'Oxanium', sans-serif; font-size: 22px; font-weight: 700;">
                                            Confirma tu dirección de correo</h2>

                                        <p style="margin: 0 0 20px; color: #b9b3cc; font-size: 16px; line-height: 1.6;">
                                            ¡Hola ${nombre}!
                                        </p>

                                        <p style="margin: 0 0 20px; color: #b9b3cc; font-size: 16px; line-height: 1.6;">
                                            Gracias por registrarte en ANILEZ. Para completar tu registro y comenzar a
                                            explorar anime, manga y tus listas de seguimiento, necesitamos que
                                            confirmes tu dirección de correo electrónico.
                                        </p>

                                        <p style="margin: 0 0 30px; color: #b9b3cc; font-size: 16px; line-height: 1.6;">
                                            Haz clic en el botón de abajo para activar tu cuenta:
                                        </p>

                                        <!-- Botón CTA -->
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="padding: 0 0 30px;">
                                                    <a href="${verificationUrl}"
                                                        style="display: inline-block; background-color: #946ed9; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-family: 'Oxanium', sans-serif; font-size: 16px; font-weight: 700; box-shadow: 0 4px 14px rgba(148, 110, 217, 0.4);">
                                                        Verificar email
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Alerta de seguridad -->
                                        <div
                                            style="background-color: rgba(148, 110, 217, 0.1); border-left: 4px solid #946ed9; padding: 16px; border-radius: 6px; margin-bottom: 25px;">
                                            <p style="margin: 0 0 8px; color: #d9cef5; font-size: 14px; font-weight: 600;">
                                                ⚠️ <strong>Nota importante:</strong>
                                            </p>
                                            <p style="margin: 0; color: #c3b9dd; font-size: 14px; line-height: 1.5;">
                                                Este enlace expirará en 24 horas por seguridad.
                                                Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
                                            </p>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td
                                        style="background-color: #0d0c15; padding: 30px; text-align: center; border-top: 1px solid #2a2140;">
                                        <p style="margin: 0 0 15px; color: #6f6886; font-size: 13px;">
                                            Descubre, sigue y valora tus animes y mangas favoritos. Estrenos por
                                            temporada, listas personalizadas y recomendaciones para ti.
                                        </p>
                                        <p style="margin: 20px 0 0; color: #57506b; font-size: 12px;">
                                            © 2026 ANILEZ. Todos los derechos reservados.<br>
                                            <a href="${frontendUrl}" style="color: #946ed9; text-decoration: none;">
                                                Visita nuestro sitio web
                                            </a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
        `,
      });
      this.logger.log(`Correo de verificación enviado a ${correo}`);
    } catch (error) {
      this.logger.error(`Error al enviar correo de verificación a ${correo}:`, error);
      throw error;
    }
  }

  async enviarCorreoRestablecerContrasena(
    correo: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/restablecer-password?token=${token}&correo=${encodeURIComponent(correo)}`;

    try {
      await this.transporter.sendMail({
        from: `"ANILEZ" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
        to: correo,
        subject: 'Restablece tu contraseña - ANILEZ',
        html: `
            <!DOCTYPE html>
            <html lang="es">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Restablecer contraseña</title>
            </head>

            <body
                style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0912;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0912; padding: 40px 0;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0"
                                style="background-color: #110f1a; border: 1px solid #2a2140; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(148, 110, 217, 0.15);">
                                <!-- Header -->
                                <tr>
                                    <td
                                        style="background: linear-gradient(rgba(10, 9, 16, 0.7), rgba(10, 9, 16, 0.7)), url('https://res.cloudinary.com/dkggojses/image/upload/v1788139948/bg-emails_zxm0r6.png'); background-size: cover; background-position: center; padding: 80px 60px; text-align: center;">
                                        <img src="https://res.cloudinary.com/dkggojses/image/upload/v1788755301/logo_fwuv5m.svg"
                                        alt="ANILEZ" width="220"
                                            style="display: inline-block; max-width: 220px; height: auto;">
                                    </td>
                                </tr>

                                <!-- Contenido -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2
                                            style="margin: 0 0 20px; color: #f4f2fa; font-family: 'Oxanium', sans-serif; font-size: 22px; font-weight: 700;">
                                            Solicitud de restablecimiento de contraseña</h2>

                                        <p style="margin: 0 0 20px; color: #b9b3cc; font-size: 16px; line-height: 1.6;">
                                            Hola ${nombre}
                                        </p>

                                        <p style="margin: 0 0 20px; color: #b9b3cc; font-size: 16px; line-height: 1.6;">
                                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de ANILEZ.
                                        </p>

                                        <p style="margin: 0 0 30px; color: #b9b3cc; font-size: 16px; line-height: 1.6;">
                                            Para crear una nueva contraseña, haz clic en el siguiente botón:
                                        </p>

                                        <!-- Botón CTA -->
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="padding: 0 0 30px;">
                                                    <a href="${resetUrl}"
                                                        style="display: inline-block; background-color: #946ed9; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-family: 'Oxanium', sans-serif; font-size: 16px; font-weight: 700; box-shadow: 0 4px 14px rgba(148, 110, 217, 0.4);">
                                                        Restablecer mi contraseña
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Alerta de seguridad -->
                                        <div
                                            style="background-color: rgba(148, 110, 217, 0.1); border-left: 4px solid #946ed9; padding: 16px; border-radius: 6px; margin-bottom: 25px;">
                                            <p style="margin: 0 0 8px; color: #d9cef5; font-size: 14px; font-weight: 600;">
                                                ⚠️ <strong>Aviso de seguridad</strong>
                                            </p>
                                            <p style="margin: 0; color: #c3b9dd; font-size: 14px; line-height: 1.5;">
                                                Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, ignora
                                                este correo y tu contraseña permanecerá sin cambios.
                                            </p>
                                        </div>

                                        <div style="border-top: 1px solid #2a2140; padding-top: 25px;">
                                            <p style="margin: 0 0 15px; color: #8a83a3; font-size: 14px; line-height: 1.6;">
                                                <strong style="color: #b9b3cc;">¿No solicitaste esto?</strong>
                                            </p>

                                            <p style="margin: 0; color: #8a83a3; font-size: 14px; line-height: 1.6;">
                                                Si no realizaste esta solicitud, es posible que alguien haya intentado acceder a tu
                                                cuenta. Por seguridad, te recomendamos cambiar tu contraseña inmediatamente después
                                                de iniciar sesión. Si tienes alguna preocupación sobre la seguridad de tu cuenta,
                                                contáctanos.
                                            </p>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td
                                        style="background-color: #0d0c15; padding: 30px; text-align: center; border-top: 1px solid #2a2140;">
                                        <p style="margin: 0 0 15px; color: #6f6886; font-size: 13px;">
                                            Descubre, sigue y valora tus animes y mangas favoritos. Estrenos por
                                            temporada, listas personalizadas y recomendaciones para ti.
                                        </p>
                                        <p style="margin: 20px 0 0; color: #57506b; font-size: 12px;">
                                            © 2026 ANILEZ. Todos los derechos reservados.<br>
                                            <a href="${frontendUrl}" style="color: #946ed9; text-decoration: none;">
                                                Visita nuestro sitio web
                                            </a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
      });
      this.logger.log(`Correo de restablecimiento enviado a ${correo}`);
    } catch (error) {
      this.logger.error(`Error al enviar correo de restablecimiento a ${correo}:`, error);
      throw error;
    }
  }
}
