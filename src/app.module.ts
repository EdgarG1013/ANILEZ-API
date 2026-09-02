import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AutenticacionModule } from './autenticacion/autenticacion.module.js';
import { ListaModule } from './lista/lista.module.js';
import { GrupoModule } from './grupo/grupo.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AutenticacionModule,
    ListaModule,
    GrupoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
