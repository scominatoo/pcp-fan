import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ProgramacaoQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  flag?: string;
}

export class CreateProgramacaoDto {
  @IsDateString()
  dataProgramacao!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  grupoCodigo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  classificacaoCodigo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  itemCodigo?: number;

  @IsOptional()
  @IsInt()
  produtoId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  desenhoCliente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  plano?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  flag?: string;

  @IsInt()
  @Min(1)
  quantidade!: number;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  pedidoRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  pedidoRef2?: string;
}

export class UpdateProgramacaoDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantidade?: number;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  pedidoRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  pedidoRef2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  plano?: string;
}

export class RegistrarEntregaDto {
  @IsInt()
  @Min(1)
  quantidade!: number;
}
