import { Module } from '@nestjs/common';
import { AutenticacionModule } from '../autenticacion/autenticacion.module.js';
import { ListaController } from './lista.controller.js';
import { ListaService } from './lista.service.js';

@Module({
  imports: [AutenticacionModule],
  controllers: [ListaController],
  providers: [ListaService],
  exports: [ListaService],
})
export class ListaModule {}
