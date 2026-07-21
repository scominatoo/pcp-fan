import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateOpOperacaoDto } from './create-op-operacao.dto';

const TIPOS_OP = ['PRO', 'PIL', 'TRY', 'PRD'] as const;

export class CreateOrdemProducaoDto {
  /** Se omitido, usa próximo código disponível (último + 1). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  codigo?: number;

  /** Desenho do cliente (campo OP-PRODUTO no legado). */
  @IsString()
  @MaxLength(15)
  produtoCodigo!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999999)
  quantidade!: number;

  @IsOptional()
  @IsIn(TIPOS_OP)
  tipo?: (typeof TIPOS_OP)[number];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  clienteNome?: string;

  @IsOptional()
  @IsDateString()
  dataAbertura?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  horaAbertura?: string;

  /** Escolha de equipamento por operação do roteiro. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpOperacaoDto)
  operacoes?: CreateOpOperacaoDto[];
}
