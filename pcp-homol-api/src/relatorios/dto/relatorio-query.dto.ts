import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Filtros comuns de período para relatórios. */
export class RelatorioPeriodoQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  codigoOpInicio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  codigoOpFim?: number;
}

export class RelatorioSetorQueryDto extends RelatorioPeriodoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  secaoCodigo?: number;
}

export class RelatorioMpEstoqueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['minimo', 'maximo', 'ambos'])
  tipo?: 'minimo' | 'maximo' | 'ambos';
}

export class RelatorioProgramacaoQueryDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
