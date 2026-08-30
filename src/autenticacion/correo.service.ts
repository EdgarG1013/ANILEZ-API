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
        from: `"Anilist" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
        to: correo,
        subject: 'Verifica tu correo electrónico - Anilist',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verificar Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f23;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 0;">
                  <tr>
                      <td align="center">
                          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                              <!-- Header -->
                              <tr>
                                  <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f3460 100%); padding: 40px 60px; text-align: center;">
                                      <h1 style="margin: 0; color: #00d4ff; font-size: 28px; font-weight: 700;">ANILIST</h1>
                                      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Tu lista de anime y manga</p>
                                  </td>
                              </tr>

                              <!-- Contenido -->
                              <tr>
                                  <td style="padding: 40px 30px;">
                                      <h2 style="margin: 0 0 20px; color: #e2e8f0; font-size: 22px; font-weight: 600;">Confirma tu dirección de correo</h2>

                                      <p style="margin: 0 0 20px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                                          ¡Hola ${nombre}!
                                      </p>

                                      <p style="margin: 0 0 20px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                                          Gracias por registrarte en Anilist. Para completar tu registro y comenzar a
                                          gestionar tu lista de anime y manga, necesitamos que confirmes tu dirección
                                          de correo electrónico.
                                      </p>

                                      <p style="margin: 0 0 30px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                                          Haz clic en el botón de abajo para activar tu cuenta:
                                      </p>

                                      <!-- Botón CTA -->
                                      <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                              <td align="center" style="padding: 0 0 30px;">
                                                  <a href="${verificationUrl}" style="display: inline-block; background-color: #00d4ff; color: #0f0f23; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700;">
                                                      Verificar correo
                                                  </a>
                                              </td>
                                          </tr>
                                      </table>

                                      <p style="margin: 0 0 15px; color: #64748b; font-size: 14px; line-height: 1.6;">
                                          Si el botón no funciona, copia y pega este enlace en tu navegador:
                                      </p>

                                      <p style="margin: 0 0 30px; padding: 12px; background-color: #0f0f23; border: 1px solid #334155; border-radius: 6px; word-break: break-all; font-size: 13px; color: #00d4ff;">
                                          ${verificationUrl}
                                      </p>

                                      <!-- Alerta de seguridad -->
                                      <div style="background-color: #1e1e3a; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 25px;">
                                          <p style="margin: 0 0 8px; color: #f59e0b; font-size: 14px; font-weight: 600;">
                                              Nota importante:
                                          </p>
                                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                                              Este enlace expirará en 24 horas por seguridad.
                                              Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
                                          </p>
                                      </div>
                                  </td>
                              </tr>

                              <!-- Footer -->
                              <tr>
                                  <td style="background-color: #12121f; padding: 30px; text-align: center; border-top: 1px solid #1e293b;">
                                      <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                                          <strong>Anilist</strong>
                                      </p>
                                      <p style="margin: 20px 0 0; color: #475569; font-size: 12px;">
                                          © ${new Date().getFullYear()} Anilist. Todos los derechos reservados.
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
        from: `"Anilist" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
        to: correo,
        subject: 'Restablece tu contraseña - Anilist',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Restablecer contraseña</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f23;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 0;">
                  <tr>
                      <td align="center">
                          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                              <!-- Header -->
                              <tr>
                                  <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f3460 100%); padding: 40px 60px; text-align: center;">
                                      <h1 style="margin: 0; color: #00d4ff; font-size: 28px; font-weight: 700;">ANILIST</h1>
                                      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Tu lista de anime y manga</p>
                                  </td>
                              </tr>

                              <!-- Contenido -->
                              <tr>
                                  <td style="padding: 40px 30px;">
                                      <h2 style="margin: 0 0 20px; color: #e2e8f0; font-size: 22px; font-weight: 600;">Solicitud de restablecimiento de contraseña</h2>

                                      <p style="margin: 0 0 20px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                                          Hola ${nombre}
                                      </p>

                                      <p style="margin: 0 0 20px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                                          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de Anilist.
                                      </p>

                                      <p style="margin: 0 0 30px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                                          Para crear una nueva contraseña, haz clic en el siguiente botón:
                                      </p>

                                      <!-- Botón CTA -->
                                      <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                              <td align="center" style="padding: 0 0 30px;">
                                                  <a href="${resetUrl}" style="display: inline-block; background-color: #f59e0b; color: #0f0f23; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700;">
                                                      Restablecer mi contraseña
                                                  </a>
                                              </td>
                                          </tr>
                                      </table>

                                      <!-- Alerta de seguridad -->
                                      <div style="background-color: #1e1e3a; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 25px;">
                                          <p style="margin: 0 0 8px; color: #f59e0b; font-size: 14px; font-weight: 600;">
                                              Aviso de seguridad
                                          </p>
                                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                                              Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, ignora
                                              este correo y tu contraseña permanecerá sin cambios.
                                          </p>
                                      </div>

                                      <div style="border-top: 1px solid #1e293b; padding-top: 25px;">
                                          <p style="margin: 0 0 15px; color: #64748b; font-size: 14px; line-height: 1.6;">
                                              <strong>¿No solicitaste esto?</strong>
                                          </p>
                                          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                              Si no realizaste esta solicitud, es posible que alguien haya intentado acceder a tu
                                              cuenta. Por seguridad, te recomendamos cambiar tu contraseña inmediatamente después
                                              de iniciar sesión.
                                          </p>
                                      </div>
                                  </td>
                              </tr>

                              <!-- Footer -->
                              <tr>
                                  <td style="background-color: #12121f; padding: 30px; text-align: center; border-top: 1px solid #1e293b;">
                                      <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                                          <strong>Anilist</strong>
                                      </p>
                                      <p style="margin: 20px 0 0; color: #475569; font-size: 12px;">
                                          © ${new Date().getFullYear()} Anilist. Todos los derechos reservados.
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
