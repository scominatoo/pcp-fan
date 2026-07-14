import { Module } from '@nestjs/common';
import { ProgramacaoController } from './programacao.controller';
import { ProgramacaoService } from './programacao.service';

@Module({
  controllers: [ProgramacaoController],
  providers: [ProgramacaoService],
})
export class ProgramacaoModule {}
