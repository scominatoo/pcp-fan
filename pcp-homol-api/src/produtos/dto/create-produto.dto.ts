import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProdutoDto {
  @IsInt()
  @Min(1)
  @Max(999)
  grupoCodigo: number;

  @IsInt()
  @Min(1)
  @Max(99)
  classificacaoCodigo: number;

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
  @MaxLength(15)
  desenhoSparta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  desenhoCliente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  planejamento?: string;
}
