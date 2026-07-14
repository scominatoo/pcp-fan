import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Escolha de equipamento por operação (override do processo padrão). */
export class CreateOpOperacaoDto {
  @IsInt()
  @Min(1)
  @Max(99)
  numeroOperacao!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(15)
  indice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  equipamentoGrupo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  equipamentoCodigo?: number;
}
