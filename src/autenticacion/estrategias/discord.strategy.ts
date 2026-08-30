import { Strategy } from 'passport-discord';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class DiscordEstrategia extends PassportStrategy(Strategy, 'discord') {
  constructor() {
    super({
      clientID: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:8000/api'}/auth/discord/callback`,
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ) {
    const { id, username, email, avatar } = profile;

    const avatarUrl = avatar
      ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
      : null;

    done(null, {
      providerId: id,
      email: email ?? null,
      nombre: username,
      avatar: avatarUrl,
    });
  }
}
