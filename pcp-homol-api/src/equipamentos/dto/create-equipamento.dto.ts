import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEquipamentoDto {
  @IsInt()
  @Min(1)
  grupoCodigo: number;

  @IsInt()
  @Min(1)
  codigo: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  modelo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  marca?: string;
}
