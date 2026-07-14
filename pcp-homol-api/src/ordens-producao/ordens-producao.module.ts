import { Module } from '@nestjs/common';
import { OrdensProducaoController } from './ordens-producao.controller';
import { OrdensProducaoService } from './ordens-producao.service';

@Module({
  controllers: [OrdensProducaoController],
  providers: [OrdensProducaoService],
})
export class OrdensProducaoModule {}
