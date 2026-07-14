import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      nome: 'PCP Homologação API',
      versao: '0.1.0',
      descricao: 'Backend NestJS — migração do sistema COBOL FANANDRI',
    };
  }
}
