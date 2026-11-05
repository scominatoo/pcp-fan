import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { TrocarSenhaDto } from '../usuarios/dto/usuario.dto';
import { AllowPendingPassword } from './allow-pending-password.decorator';
import { AuthRequest } from './auth-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @AllowPendingPassword()
  @Get('me')
  me(@Req() req: AuthRequest) {
    return this.auth.me(req.user!);
  }

  @AllowPendingPassword()
  @Post('trocar-senha')
  trocarSenha(@Body() dto: TrocarSenhaDto, @Req() req: AuthRequest) {
    return this.auth.trocarSenha(req.user!.id, dto.senhaAtual, dto.novaSenha);
  }
}
