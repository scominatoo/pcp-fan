import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Baixa de uma operação da OP (paridade PC1132 / PCPA132I). */
export class BaixaOperacaoDto {
  @IsInt()
  @Min(1)
  @Max(99)
  numeroOperacao!: number;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  horaInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  horaFim?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  equipamentoGrupo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  equipamentoCodigo?: number;

  /** Quantidade produzida na operação (qtde saída). */
  @IsInt()
  @Min(0)
  @Max(999999)
  qtdeSaida!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoSaida?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtdeEntrada?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoEntrada?: number;

  @IsOptional()
  @IsBoolean()
  atualizouEstoque?: boolean;
}
