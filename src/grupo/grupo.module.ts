import { Module } from '@nestjs/common';
import { AutenticacionModule } from '../autenticacion/autenticacion.module.js';
import { GrupoController } from './grupo.controller.js';
import { GrupoService } from './grupo.service.js';

@Module({
  imports: [AutenticacionModule],
  controllers: [GrupoController],
  providers: [GrupoService],
  exports: [GrupoService],
})
export class GrupoModule {}
