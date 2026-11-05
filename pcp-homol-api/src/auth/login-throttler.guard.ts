import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Limita tentativas de login por IP + usuário. Assim um operador errando a
 * senha não bloqueia os colegas que saem pela mesma internet da fábrica.
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    return `${req.ip}:${username}`;
  }
}
