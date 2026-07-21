import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';

@Module({
  controllers: [ClientesController],
  providers: [ClientesService],
  // Exporta o service caso a OP (ou outro módulo) queira injetar no futuro
  exports: [ClientesService],
})
export class ClientesModule {}
