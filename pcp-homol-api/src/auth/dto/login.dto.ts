import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o usuário' })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a senha' })
  @MinLength(8, { message: 'Senha inválida' })
  password!: string;
}
