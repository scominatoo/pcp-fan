import { Module } from '@nestjs/common';
import { MateriaPrimaController } from './materia-prima.controller';
import { MateriaPrimaService } from './materia-prima.service';

@Module({
  controllers: [MateriaPrimaController],
  providers: [MateriaPrimaService],
})
export class MateriaPrimaModule {}
