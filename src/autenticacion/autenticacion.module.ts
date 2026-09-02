import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AutenticacionController } from './autenticacion.controller.js';
import { AutenticacionService } from './autenticacion.service.js';
import { JwtEstrategia } from './estrategias/jwt.strategy.js';
import { GoogleEstrategia } from './estrategias/google.strategy.js';
import { DiscordEstrategia } from './estrategias/discord.strategy.js';
import { CorreoService } from './correo.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AutenticacionController],
  providers: [
    AutenticacionService,
    JwtEstrategia,
    GoogleEstrategia,
    DiscordEstrategia,
    CorreoService,
  ],
  exports: [AutenticacionService, JwtModule, PassportModule],
})
export class AutenticacionModule {}
