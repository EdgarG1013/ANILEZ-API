import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AutenticacionController } from './autenticacion.controller.js';
import { AutenticacionService } from './autenticacion.service.js';
import { JwtEstrategia } from './estrategias/jwt.strategy.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, JwtEstrategia],
  exports: [AutenticacionService, JwtModule],
})
export class AutenticacionModule {}
