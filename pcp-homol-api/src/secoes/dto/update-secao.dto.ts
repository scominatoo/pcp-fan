import { PartialType } from '@nestjs/mapped-types';
import { CreateSecaoDto } from './create-secao.dto';

export class UpdateSecaoDto extends PartialType(CreateSecaoDto) {}
