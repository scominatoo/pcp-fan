import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

/** Baixa de matéria-prima na OP (paridade PC1109 / PCPA109I). */
export class BaixaMateriaPrimaDto {
  @IsInt()
  @Min(1)
  materiaPrimaId!: number;

  @IsNumber()
  @Min(0.01)
  quantidade!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtdeRolos?: number;

  @IsOptional()
  @IsDateString()
  dataBaixa?: string;
}
