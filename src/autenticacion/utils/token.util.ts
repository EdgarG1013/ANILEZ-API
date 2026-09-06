import * as crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'ANILEZ-email-verify-secret';

export function hashToken(email: string): string {
  const payload = `${email}:${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function unhashToken(token: string): string {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 3) throw new Error('Token inválido');

    const signature = parts.pop()!;
    const timestamp = Number(parts.pop()!);
    const email = parts.join(':');

    // Verificar firma
    const payload = `${email}:${timestamp}`;
    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSig) {
      throw new Error('Firma inválida');
    }

    // Verificar expiración (24 horas)
    const hoursSinceCreation = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new Error('Token expirado');
    }

    return email;
  } catch {
    throw new Error('Token de verificación inválido o expirado');
  }
}
