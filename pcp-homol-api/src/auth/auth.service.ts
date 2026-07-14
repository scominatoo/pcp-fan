import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Autentica o único usuário permitido (admin).
   * Credenciais vêm do .env — nunca ficam no código-fonte.
   */
  async login(dto: LoginDto) {
    const expectedUser = this.config.get<string>('ADMIN_USERNAME') ?? 'admin';
    const passwordHash = this.config.get<string>('ADMIN_PASSWORD_HASH');
    const passwordPlain = this.config.get<string>('ADMIN_PASSWORD');

    if (!passwordHash && !passwordPlain) {
      throw new UnauthorizedException(
        'Credenciais do admin não configuradas no servidor (.env).',
      );
    }

    const userOk = dto.username.trim().toLowerCase() === expectedUser.toLowerCase();

    let passOk = false;
    if (passwordHash) {
      passOk = await bcrypt.compare(dto.password, passwordHash);
    } else if (passwordPlain) {
      // Fallback de homologação: senha em texto no .env (prefira HASH em produção)
      passOk = dto.password === passwordPlain;
    }

    if (!userOk || !passOk) {
      // Mensagem genérica — não revela se o usuário ou a senha erraram
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    const expiresSeconds = Number(
      this.config.get('JWT_EXPIRES_SECONDS') ?? 8 * 60 * 60,
    );
    const payload = { sub: expectedUser, role: 'admin' };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: expiresSeconds,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: `${expiresSeconds}s`,
      user: { username: expectedUser, role: 'admin' },
    };
  }

  /** Retorna quem está autenticado (usado por GET /auth/me). */
  me(username: string) {
    return { username, role: 'admin' };
  }
}
