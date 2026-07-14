import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSecaoDto {
  @IsInt()
  @Min(1)
  @Max(9999)
  codigo: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  responsavel1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  responsavel2?: string;
}
