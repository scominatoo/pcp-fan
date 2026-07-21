import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './clientes/clientes.module';
import { EquipamentosModule } from './equipamentos/equipamentos.module';
import { HealthModule } from './health/health.module';
import { MateriaPrimaModule } from './materia-prima/materia-prima.module';
import { OrdensProducaoModule } from './ordens-producao/ordens-producao.module';
import { ProcessosModule } from './processos/processos.module';
import { ProgramacaoModule } from './programacao/programacao.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutosModule } from './produtos/produtos.module';
import { SecoesModule } from './secoes/secoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    ProdutosModule,
    MateriaPrimaModule,
    EquipamentosModule,
    SecoesModule,
    ProcessosModule,
    ClientesModule,
    OrdensProducaoModule,
    ProgramacaoModule,
    RelatoriosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
