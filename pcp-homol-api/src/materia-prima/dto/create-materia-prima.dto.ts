import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMateriaPrimaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1)
  classeLetra: string;

  @IsInt()
  @Min(0)
  @Max(99)
  classeNumero: number;

  @IsInt()
  @Min(1)
  @Max(99999)
  itemCodigo: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  descricao: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  unidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  qualidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  dureza?: string;
}
