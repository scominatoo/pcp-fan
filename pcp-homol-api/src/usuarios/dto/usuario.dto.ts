import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TODAS_PERMISSOES } from '../../auth/permissions';

export const SENHA_MIN = 8;

export class CreateUsuarioDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,40}$/, {
    message: 'Usuário deve ter 3 a 40 caracteres: letras, números, ponto, hífen ou _',
  })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o nome' })
  @MaxLength(80)
  nome!: string;

  @IsString()
  @MinLength(SENHA_MIN, { message: `A senha deve ter pelo menos ${SENHA_MIN} caracteres` })
  senha!: string;

  /** Obriga o usuário a trocar a senha no primeiro login. */
  @IsOptional()
  @IsBoolean()
  exigirTroca?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(TODAS_PERMISSOES, { each: true, message: 'A lista contém uma permissão inválida' })
  permissoes?: string[];
}

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome' })
  @MaxLength(80)
  nome?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(TODAS_PERMISSOES, { each: true, message: 'A lista contém uma permissão inválida' })
  permissoes?: string[];
}

export class RedefinirSenhaDto {
  @IsString()
  @MinLength(SENHA_MIN, { message: `A senha deve ter pelo menos ${SENHA_MIN} caracteres` })
  senha!: string;

  /**
   * true  = usuário precisa trocar no próximo login;
   * false = a senha definida pelo admin continua valendo.
   */
  @IsOptional()
  @IsBoolean()
  exigirTroca?: boolean;
}

export class TrocarSenhaDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe a senha atual' })
  senhaAtual!: string;

  @IsString()
  @MinLength(SENHA_MIN, { message: `A nova senha deve ter pelo menos ${SENHA_MIN} caracteres` })
  novaSenha!: string;
}
