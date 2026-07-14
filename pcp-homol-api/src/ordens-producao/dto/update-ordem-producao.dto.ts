import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdemProducaoDto } from './create-ordem-producao.dto';

export class UpdateOrdemProducaoDto extends PartialType(CreateOrdemProducaoDto) {}
