import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class TempoOperacaoDto {
  @IsInt()
  @Min(1)
  @Max(25)
  numeroOperacao!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  prepMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  prodMin?: number;
}

/** Encerramento consolidado da OP (paridade PC1028 / PCPA71I). */
export class EncerrarOpDto {
  @IsOptional()
  @IsDateString()
  dataBaixa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaBaixa?: string;

  @IsInt()
  @Min(0)
  @Max(999999)
  pecasProduzidas!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mpConsumida?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rolos?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  turno1?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  turno2?: number;

  @IsOptional()
  @IsBoolean()
  baixadaMp?: boolean;

  @IsOptional()
  @IsBoolean()
  baixadaProduto?: boolean;

  /** Tempos por operação (até 25 slots, como no legado). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TempoOperacaoDto)
  temposOperacoes?: TempoOperacaoDto[];
}
