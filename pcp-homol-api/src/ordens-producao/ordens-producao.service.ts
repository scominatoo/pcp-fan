import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProcessoOperacao } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateParams, paginated } from '../common/pagination';
import { formatarCodigoProduto } from '../produtos/produtos.serializer';
import { formatarCodigoMateriaPrima } from '../materia-prima/materia-prima.serializer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpOperacaoDto } from './dto/create-op-operacao.dto';
import { CreateOrdemProducaoDto } from './dto/create-ordem-producao.dto';
import { UpdateOrdemProducaoDto } from './dto/update-ordem-producao.dto';
import { BaixaOperacaoDto } from './dto/baixa-operacao.dto';
import { EncerrarOpDto } from './dto/encerrar-op.dto';
import { BaixaMateriaPrimaDto } from './dto/baixa-materia-prima.dto';
import {
  EmissaoOperacao,
  EquipamentoTab,
  formatarEquipamento,
  formatarSegundos,
  labelTipoOp,
} from './ordens-producao-emissao.serializer';
import { serializeOrdemProducao } from './ordens-producao.serializer';

const TIPOS_VALIDOS = new Set(['PRO', 'PIL', 'TRY', 'PRD']);

@Injectable()
export class OrdensProducaoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto & { aberta?: string }) {
    const { page, limit, skip, take } = paginateParams(query);
    const where = this.buildWhere(query.search, query.aberta);

    const [rows, total] = await Promise.all([
      this.prisma.ordemProducao.findMany({
        where,
        skip,
        take,
        orderBy: { codigo: 'desc' },
        include: {
          produto: { include: { grupo: true, classificacao: true } },
        },
      }),
      this.prisma.ordemProducao.count({ where }),
    ]);

    return paginated(
      rows.map((row) => serializeOrdemProducao(row)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    const op = await this.carregarOp(id);
    return serializeOrdemProducao(op, true);
  }

  async findByCodigo(codigo: number) {
    const op = await this.prisma.ordemProducao.findUnique({
      where: { codigo },
      include: this.includeOpCompleto(),
    });
    if (!op) {
      throw new NotFoundException(`OP ${codigo} não encontrada`);
    }
    return serializeOrdemProducao(op, true);
  }

  async proximoCodigo() {
    const agg = await this.prisma.ordemProducao.aggregate({
      _max: { codigo: true },
    });
    return { codigo: (agg._max.codigo ?? 0) + 1 };
  }

  /** Dados para montar o formulário de nova OP (produto + roteiro). */
  async prepararCriacao(produtoCodigo: string) {
    // Remove espaços das pontas — no legado o desenho às vezes vem com padding.
    const limpo = produtoCodigo.trim();
    if (!limpo) {
      throw new BadRequestException('Informe o desenho do cliente');
    }

    // 1) Tenta achar o produto pelo desenho digitado (cliente ou Sparta).
    const produto = await this.resolverProduto(limpo);

    // 2) Chaves possíveis do processo = texto digitado + desenhos do produto.
    const chavesProcesso = [
      limpo,
      produto?.desenhoCliente?.trim(),
      produto?.desenhoSparta?.replace(/\./g, '').trim(),
    ].filter((v): v is string => Boolean(v && v.length > 0));

    // Match exato OU começa com o código (cobre campos com espaços do COBOL).
    const processo = await this.prisma.processoProdutivo.findFirst({
      where: {
        OR: [
          { produtoCodigo: { in: [...new Set(chavesProcesso)] } },
          ...[...new Set(chavesProcesso)].map((chave) => ({
            produtoCodigo: { startsWith: chave },
          })),
        ],
      },
      include: {
        operacoes: { orderBy: { numeroOperacao: 'asc' } },
        produto: true,
      },
    });

    // Sem produto E sem processo → mensagem clara apontando o menu Processos.
    if (!produto && !processo) {
      throw new BadRequestException(
        `Desenho "${limpo}" não encontrado em Produtos nem em Processos. ` +
          'Abra Cadastros → Processos para ver códigos válidos (ex.: 93288311).',
      );
    }

    if (!processo || processo.operacoes.length === 0) {
      throw new BadRequestException(
        `Não há roteiro (PC1070) com operações para o desenho "${limpo}". ` +
          'Confira em Cadastros → Processos.',
      );
    }

    if (!produto && !processo.produto) {
      // Processo existe, mas não está ligado a um produto — ainda permite emitir OP.
      // (Na prática o create exigir produto; aqui já avisamos cedo).
      throw new BadRequestException(
        `Roteiro encontrado (${processo.produtoCodigo.trim()}), ` +
          'mas esse desenho não está no cadastro de Produtos. Cadastre o produto ou use outro desenho.',
      );
    }

    const produtoFinal = produto ?? processo.produto!;

    return {
      produtoCodigo: processo.produtoCodigo.trim(),
      produtoDescricao: produtoFinal.descricao,
      produtoCodigoFormatado: formatarCodigoProduto(produtoFinal),
      materiasPrimas: processo.materiasPrimas,
      operacoes: processo.operacoes.map((op) => {
        const alternativas = this.parseAlternativas(op.equipamentosTab);
        const padrao =
          op.equipamentoEscolhido && op.equipamentoEscolhido > 0
            ? op.equipamentoEscolhido
            : alternativas.length > 0
              ? 1
              : 0;
        return {
          numeroOperacao: op.numeroOperacao,
          descricao: op.descricao,
          secaoCodigo: op.secaoCodigo,
          equipamentoPadraoIndice: padrao,
          alternativas: alternativas.map((alt, idx) => ({
            indice: idx + 1,
            equipamentoGrupo: alt.equipamentoGrupo,
            equipamentoCodigo: alt.equipamentoCodigo,
            ferramentaNumero: alt.ferramentaNumero ?? null,
            label: formatarEquipamento(
              alt.equipamentoGrupo,
              alt.equipamentoCodigo,
            ),
          })),
        };
      }),
    };
  }

  async create(dto: CreateOrdemProducaoDto) {
    const produtoCodigo = dto.produtoCodigo.trim();
    const produto = await this.resolverProduto(produtoCodigo);
    if (!produto) {
      throw new BadRequestException('Desenho/produto não cadastrado');
    }

    const chavesProcesso = [
      produtoCodigo,
      produto.desenhoCliente?.trim(),
      produto.desenhoSparta?.replace(/\./g, '').trim(),
    ].filter((v): v is string => Boolean(v && v.length > 0));

    const processo = await this.prisma.processoProdutivo.findFirst({
      where: { produtoCodigo: { in: [...new Set(chavesProcesso)] } },
      include: {
        operacoes: { orderBy: { numeroOperacao: 'asc' } },
      },
    });

    if (!processo || processo.operacoes.length === 0) {
      throw new BadRequestException(
        'Processo produtivo não cadastrado para este produto',
      );
    }

    const tipo = dto.tipo ?? 'PRD';
    if (!TIPOS_VALIDOS.has(tipo)) {
      throw new BadRequestException('Tipo deve ser PRO, PIL, TRY ou PRD');
    }

    const codigo =
      dto.codigo ?? (await this.proximoCodigo()).codigo;

    const codigoEmUso = await this.prisma.ordemProducao.findUnique({
      where: { codigo },
    });
    if (codigoEmUso) {
      throw new BadRequestException(`OP ${codigo} já cadastrada`);
    }

    const agora = new Date();
    const overrides = new Map(
      (dto.operacoes ?? []).map((o) => [o.numeroOperacao, o]),
    );

    const operacoesCreate = processo.operacoes.map((procOp) => {
      const escolha = this.resolverEquipamentoOperacao(
        procOp,
        overrides.get(procOp.numeroOperacao),
      );
      return {
        numeroOperacao: procOp.numeroOperacao,
        equipamentoGrupo: escolha.equipamentoGrupo,
        equipamentoCodigo: escolha.equipamentoCodigo,
        indice: escolha.indice,
        ferramentaFabrica: escolha.ferramentaFabrica,
        ferramentaNumero: escolha.ferramentaNumero,
        ferramentaMatricula: escolha.ferramentaMatricula,
      };
    });

    try {
      const op = await this.prisma.ordemProducao.create({
        data: {
          codigo,
          // Grava a chave canônica do processo (alinhada ao PCPA70I)
          produtoCodigo: processo.produtoCodigo,
          produtoId: produto.id,
          quantidade: dto.quantidade,
          tipo,
          clienteNome: dto.clienteNome?.trim() || null,
          dataAbertura: dto.dataAbertura
            ? new Date(dto.dataAbertura)
            : agora,
          horaAbertura:
            dto.horaAbertura ?? this.formatarHoraAgora(agora),
          baixada: false,
          baixadaMp: false,
          baixadaProduto: false,
          operacoes: { create: operacoesCreate },
        },
        include: this.includeOpCompleto(),
      });
      return serializeOrdemProducao(op, true);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Já existe OP com este código');
      }
      throw e;
    }
  }

  /** Dados para emissão/impressão (paridade PC1041). */
  async emissao(id: number) {
    const op = await this.carregarOp(id);

    if (op.baixada) {
      throw new BadRequestException(
        'OP baixada — emissão não permitida no legado',
      );
    }

    const processo = await this.prisma.processoProdutivo.findUnique({
      where: { produtoCodigo: op.produtoCodigo },
      include: {
        operacoes: { orderBy: { numeroOperacao: 'asc' } },
      },
    });

    const processoPorNum = new Map(
      (processo?.operacoes ?? []).map((o) => [o.numeroOperacao, o]),
    );

    const paresEquip = op.operacoes
      .filter((o) => o.equipamentoGrupo && o.equipamentoCodigo)
      .map((o) => ({
        grupoCodigo: o.equipamentoGrupo!,
        codigo: o.equipamentoCodigo!,
      }));

    const equipamentos =
      paresEquip.length > 0
        ? await this.prisma.equipamento.findMany({
            where: { OR: paresEquip },
          })
        : [];

    const equipMap = new Map(
      equipamentos.map((e) => [
        `${e.grupoCodigo}-${e.codigo}`,
        e.descricao,
      ]),
    );

    const secoesCodigos = [
      ...new Set(
        (processo?.operacoes ?? [])
          .map((o) => o.secaoCodigo)
          .filter((c): c is number => c != null && c > 0),
      ),
    ];

    const secoes =
      secoesCodigos.length > 0
        ? await this.prisma.secao.findMany({
            where: { codigo: { in: secoesCodigos } },
          })
        : [];

    const secaoMap = new Map(secoes.map((s) => [s.codigo, s.descricao]));

    const operacoes: EmissaoOperacao[] = op.operacoes.map((opOper) => {
      const proc = processoPorNum.get(opOper.numeroOperacao);
      const eqKey =
        opOper.equipamentoGrupo != null && opOper.equipamentoCodigo != null
          ? `${opOper.equipamentoGrupo}-${opOper.equipamentoCodigo}`
          : null;

      const ferramenta = opOper.ferramentaNumero
        ? [opOper.ferramentaFabrica, opOper.ferramentaNumero]
            .filter(Boolean)
            .join(' ')
            .trim()
        : null;

      return {
        numeroOperacao: opOper.numeroOperacao,
        descricao: proc?.descricao ?? null,
        observacao1: proc?.observacao1 ?? null,
        observacao2: proc?.observacao2 ?? null,
        plano: proc?.plano ?? null,
        secaoCodigo: proc?.secaoCodigo ?? null,
        secaoDescricao: proc?.secaoCodigo
          ? (secaoMap.get(proc.secaoCodigo) ?? null)
          : null,
        preparacao: formatarSegundos(proc?.preparacaoSegundos ?? null),
        producao: formatarSegundos(proc?.producaoSegundos ?? null),
        equipamento: formatarEquipamento(
          opOper.equipamentoGrupo,
          opOper.equipamentoCodigo,
          eqKey ? (equipMap.get(eqKey) ?? null) : null,
        ),
        ferramenta,
        dataEncerramento: opOper.dataEncerramento,
      };
    });

    return {
      op: serializeOrdemProducao(op, true),
      tipoLabel: labelTipoOp(op.tipo),
      materiasPrimas: processo?.materiasPrimas ?? null,
      operacoes,
      emitidoEm: new Date().toISOString(),
    };
  }

  async update(id: number, dto: UpdateOrdemProducaoDto) {
    const atual = await this.carregarOp(id);

    if (atual.baixada) {
      throw new BadRequestException('OP baixada não pode ser alterada');
    }

    const data: Prisma.OrdemProducaoUpdateInput = {};
    if (dto.quantidade != null) data.quantidade = dto.quantidade;
    if (dto.tipo != null) data.tipo = dto.tipo;
    if (dto.horaAbertura != null) data.horaAbertura = dto.horaAbertura;
    if (dto.dataAbertura) data.dataAbertura = new Date(dto.dataAbertura);
    if (dto.clienteNome != null) data.clienteNome = dto.clienteNome;

    if (dto.produtoCodigo) {
      const limpo = dto.produtoCodigo.trim();
      const produto = await this.resolverProduto(limpo);
      if (!produto) {
        throw new BadRequestException('Desenho/produto não cadastrado');
      }
      data.produtoCodigo = limpo;
      data.produto = { connect: { id: produto.id } };
    }

    const op = await this.prisma.ordemProducao.update({
      where: { id },
      data,
      include: this.includeOpCompleto(),
    });
    return serializeOrdemProducao(op, true);
  }

  async remove(id: number) {
    const op = await this.carregarOp(id);
    if (op.baixada) {
      throw new BadRequestException('OP baixada não pode ser excluída');
    }
    await this.prisma.ordemProducao.delete({ where: { id } });
    return { ok: true };
  }

  /** Baixas da OP — consolidada (PCPA71I) + por operação (PCPA132I). */
  async obterBaixas(id: number) {
    const op = await this.carregarOp(id);

    const [consolidada, baixasOperacao] = await Promise.all([
      this.prisma.ordemProducaoBaixaConsolidada.findUnique({
        where: { ordemProducaoId: id },
      }),
      this.prisma.ordemProducaoBaixaOperacao.findMany({
        where: { ordemProducaoId: id },
        orderBy: { numeroOperacao: 'asc' },
      }),
    ]);

    const baixasPorNum = new Map(
      baixasOperacao.map((b) => [b.numeroOperacao, b]),
    );

    return {
      op: {
        id: op.id,
        codigo: op.codigo,
        baixada: op.baixada,
        baixadaMp: op.baixadaMp,
        baixadaProduto: op.baixadaProduto,
        quantidade: op.quantidade,
      },
      consolidada: consolidada
        ? {
            dataBaixa: consolidada.dataBaixa,
            horaBaixa: consolidada.horaBaixa,
            pecasProduzidas: consolidada.pecasProduzidas,
            mpConsumida: consolidada.mpConsumida,
            rolos: consolidada.rolos,
            temposOperacoes: consolidada.temposOperacoes,
            turno1: consolidada.turno1,
            turno2: consolidada.turno2,
          }
        : null,
      operacoes: op.operacoes.map((opOper) => {
        const baixa = baixasPorNum.get(opOper.numeroOperacao);
        return {
          numeroOperacao: opOper.numeroOperacao,
          equipamentoGrupo: opOper.equipamentoGrupo,
          equipamentoCodigo: opOper.equipamentoCodigo,
          dataEncerramento: opOper.dataEncerramento,
          baixa: baixa
            ? {
                id: baixa.id,
                dataLancamento: baixa.dataLancamento,
                dataInicio: baixa.dataInicio,
                horaInicio: baixa.horaInicio,
                dataFim: baixa.dataFim,
                horaFim: baixa.horaFim,
                qtdeSaida: baixa.qtdeSaida,
                pesoSaida: baixa.pesoSaida,
                qtdeEntrada: baixa.qtdeEntrada,
                pesoEntrada: baixa.pesoEntrada,
                atualizouEstoque: baixa.atualizouEstoque,
              }
            : null,
        };
      }),
    };
  }

  /** Baixa de uma operação (PC1132 → PCPA132I). */
  async baixarOperacao(id: number, dto: BaixaOperacaoDto) {
    const op = await this.carregarOp(id);

    if (op.baixada) {
      throw new BadRequestException('OP já encerrada — não é possível baixar operação');
    }

    const opOper = op.operacoes.find(
      (o) => o.numeroOperacao === dto.numeroOperacao,
    );
    if (!opOper) {
      throw new BadRequestException(
        `Operação ${dto.numeroOperacao} não existe nesta OP`,
      );
    }

    const agora = new Date();
    const dataFim = dto.dataFim ? new Date(dto.dataFim) : agora;
    const dataInicio = dto.dataInicio ? new Date(dto.dataInicio) : dataFim;

    const equipGrupo =
      dto.equipamentoGrupo ?? opOper.equipamentoGrupo ?? null;
    const equipCodigo =
      dto.equipamentoCodigo ?? opOper.equipamentoCodigo ?? null;

    const qtdeEntrada = dto.qtdeEntrada ?? dto.qtdeSaida;
    const diferQtde = qtdeEntrada - dto.qtdeSaida;

    const baixa = await this.prisma.$transaction(async (tx) => {
      await tx.ordemProducaoBaixaOperacao.upsert({
        where: {
          ordemProducaoId_numeroOperacao: {
            ordemProducaoId: id,
            numeroOperacao: dto.numeroOperacao,
          },
        },
        create: {
          ordemProducaoId: id,
          numeroOperacao: dto.numeroOperacao,
          dataLancamento: agora,
          dataInicio,
          horaInicio: dto.horaInicio ?? this.formatarHoraAgora(dataInicio),
          dataFim,
          horaFim: dto.horaFim ?? this.formatarHoraAgora(dataFim),
          equipamentoGrupo: equipGrupo,
          equipamentoCodigo: equipCodigo,
          qtdeSaida: dto.qtdeSaida,
          pesoSaida: dto.pesoSaida ?? null,
          dataSaida: dataFim,
          qtdeEntrada,
          pesoEntrada: dto.pesoEntrada ?? dto.pesoSaida ?? null,
          dataEntrada: dataFim,
          diferQtde,
          atualizouEstoque: dto.atualizouEstoque ?? false,
        },
        update: {
          dataLancamento: agora,
          dataInicio,
          horaInicio: dto.horaInicio ?? this.formatarHoraAgora(dataInicio),
          dataFim,
          horaFim: dto.horaFim ?? this.formatarHoraAgora(dataFim),
          equipamentoGrupo: equipGrupo,
          equipamentoCodigo: equipCodigo,
          qtdeSaida: dto.qtdeSaida,
          pesoSaida: dto.pesoSaida ?? null,
          dataSaida: dataFim,
          qtdeEntrada,
          pesoEntrada: dto.pesoEntrada ?? dto.pesoSaida ?? null,
          dataEntrada: dataFim,
          diferQtde,
          atualizouEstoque: dto.atualizouEstoque ?? false,
        },
      });

      await tx.ordemProducaoOperacao.update({
        where: { id: opOper.id },
        data: { dataEncerramento: dataFim },
      });
    });

    return this.obterBaixas(id);
  }

  /** Encerramento consolidado da OP (PC1028 → PCPA71I + flags PCPA28I). */
  async encerrarOp(id: number, dto: EncerrarOpDto) {
    const op = await this.carregarOp(id);

    if (op.baixada) {
      throw new BadRequestException('OP já está baixada');
    }

    const agora = new Date();
    const dataBaixa = dto.dataBaixa ? new Date(dto.dataBaixa) : agora;
    const horaBaixa =
      dto.horaBaixa ?? this.formatarHoraAgora(dataBaixa).slice(0, 5);

    const temposJson = this.montarTemposOperacoes(
      dto.temposOperacoes,
      op.operacoes.length,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.ordemProducaoBaixaConsolidada.upsert({
        where: { ordemProducaoId: id },
        create: {
          ordemProducaoId: id,
          dataBaixa,
          horaBaixa,
          pecasProduzidas: dto.pecasProduzidas,
          mpConsumida: dto.mpConsumida ?? 0,
          rolos: dto.rolos ?? 0,
          temposOperacoes: temposJson,
          turno1: dto.turno1 ?? 0,
          turno2: dto.turno2 ?? 0,
        },
        update: {
          dataBaixa,
          horaBaixa,
          pecasProduzidas: dto.pecasProduzidas,
          mpConsumida: dto.mpConsumida ?? 0,
          rolos: dto.rolos ?? 0,
          temposOperacoes: temposJson,
          turno1: dto.turno1 ?? 0,
          turno2: dto.turno2 ?? 0,
        },
      });

      await tx.ordemProducao.update({
        where: { id },
        data: {
          baixada: true,
          baixadaMp: dto.baixadaMp ?? op.baixadaMp,
          baixadaProduto: dto.baixadaProduto ?? op.baixadaProduto,
        },
      });
    });

    return this.obterBaixas(id);
  }

  /** Baixas de MP vinculadas à OP (PC1109 / PCPA109I). */
  async obterBaixasMp(id: number) {
    const op = await this.carregarOp(id);

    const processo = await this.prisma.processoProdutivo.findUnique({
      where: { produtoCodigo: op.produtoCodigo },
    });

    const [baixas, movimentos] = await Promise.all([
      this.prisma.ordemProducaoBaixaMateriaPrima.findMany({
        where: { ordemProducaoId: id },
        include: { materiaPrima: true },
        orderBy: { dataBaixa: 'desc' },
      }),
      this.prisma.movimentoMateriaPrima.findMany({
        where: { ordemProducaoId: id },
        include: { materiaPrima: true },
        orderBy: { dataMovimento: 'desc' },
        take: 50,
      }),
    ]);

    const mpsSugeridas = await this.resolverMpsProcesso(
      processo?.materiasPrimas,
    );

    return {
      op: {
        id: op.id,
        codigo: op.codigo,
        baixadaMp: op.baixadaMp,
        produtoCodigo: op.produtoCodigo,
      },
      materiasPrimasSugeridas: mpsSugeridas,
      baixas: baixas.map((b) => ({
        id: b.id,
        materiaPrimaId: b.materiaPrimaId,
        materiaPrimaCodigo: formatarCodigoMateriaPrima(b.materiaPrima),
        materiaPrimaDescricao: b.materiaPrima.descricao,
        quantidade: b.quantidade,
        qtdeRolos: b.qtdeRolos,
        dataBaixa: b.dataBaixa,
      })),
      movimentos: movimentos.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        origem: m.origem,
        materiaPrimaCodigo: m.materiaPrima
          ? formatarCodigoMateriaPrima(m.materiaPrima)
          : `${m.classeLetra}${String(m.classeNumero).padStart(2, '0')}${String(m.itemCodigo).padStart(5, '0')}`,
        quantidade: m.quantidade,
        qtdeRolos: m.qtdeRolos,
        dataMovimento: m.dataMovimento,
        lote:
          m.loteNumero > 0
            ? `${m.loteLetra}${String(m.loteNumero).padStart(6, '0')}${m.loteLetra2}`.trim()
            : null,
      })),
    };
  }

  /** Registra baixa de MP na OP (PC1109) e atualiza estoque. */
  async baixarMateriaPrima(id: number, dto: BaixaMateriaPrimaDto) {
    const op = await this.carregarOp(id);

    if (op.baixada) {
      throw new BadRequestException(
        'OP encerrada — não é possível baixar matéria-prima',
      );
    }

    const mp = await this.prisma.materiaPrima.findUnique({
      where: { id: dto.materiaPrimaId },
    });
    if (!mp) {
      throw new NotFoundException('Matéria-prima não encontrada');
    }

    const agora = new Date();
    const dataBaixa = dto.dataBaixa ? new Date(dto.dataBaixa) : agora;
    const qtdeRolos = dto.qtdeRolos ?? 0;
    const quantidade = dto.quantidade;

    const estoqueAtual = mp.quantidade ? Number(mp.quantidade) : 0;
    if (estoqueAtual < quantidade) {
      throw new BadRequestException(
        `Estoque insuficiente: disponível ${estoqueAtual.toLocaleString('pt-BR')}, solicitado ${quantidade.toLocaleString('pt-BR')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ordemProducaoBaixaMateriaPrima.create({
        data: {
          ordemProducaoId: id,
          materiaPrimaId: mp.id,
          quantidade,
          qtdeRolos,
          dataBaixa,
        },
      });

      await tx.movimentoMateriaPrima.create({
        data: {
          loteLetra: '',
          loteNumero: 0,
          loteLetra2: '',
          indice: 0,
          tipo: 'B',
          dataMovimento: dataBaixa,
          nota: op.codigo,
          materiaPrimaId: mp.id,
          classeLetra: mp.classeLetra,
          classeNumero: mp.classeNumero,
          itemCodigo: mp.itemCodigo,
          qtdeRolos,
          quantidade,
          ordemProducaoId: id,
          origem: 'MANUAL',
        },
      });

      await tx.materiaPrima.update({
        where: { id: mp.id },
        data: {
          quantidade: { decrement: quantidade },
        },
      });

      await tx.ordemProducao.update({
        where: { id },
        data: { baixadaMp: true },
      });
    });

    return this.obterBaixasMp(id);
  }

  private async resolverMpsProcesso(materiasPrimas: unknown) {
    if (!Array.isArray(materiasPrimas)) return [];

    const sugestoes: Array<{
      materiaPrimaId: number | null;
      codigo: string;
      descricao: string | null;
      peso: number | null;
    }> = [];

    for (const item of materiasPrimas) {
      if (typeof item !== 'object' || item == null) continue;
      const raw = item as Record<string, unknown>;
      const letra = String(raw.classeLetra ?? '').trim();
      const numero = Number(raw.classeNumero ?? 0);
      const itemCodigo = Number(raw.itemCodigo ?? 0);
      if (!letra || !itemCodigo) continue;

      const mp = await this.prisma.materiaPrima.findFirst({
        where: { classeLetra: letra, classeNumero: numero, itemCodigo },
      });

      sugestoes.push({
        materiaPrimaId: mp?.id ?? null,
        codigo: mp
          ? formatarCodigoMateriaPrima(mp)
          : `${letra}${String(numero).padStart(2, '0')}${String(itemCodigo).padStart(5, '0')}`,
        descricao: mp?.descricao ?? null,
        peso: raw.peso != null ? Number(raw.peso) : null,
      });
    }

    return sugestoes;
  }

  private montarTemposOperacoes(
    informados: EncerrarOpDto['temposOperacoes'],
    qtdOperacoes: number,
  ) {
    const slots = 25;
    const base: Array<{ prepMin: number; prodMin: number }> = Array.from(
      { length: slots },
      () => ({ prepMin: 0, prodMin: 0 }),
    );

    if (informados?.length) {
      for (const t of informados) {
        if (t.numeroOperacao >= 1 && t.numeroOperacao <= slots) {
          base[t.numeroOperacao - 1] = {
            prepMin: t.prepMin ?? 0,
            prodMin: t.prodMin ?? 0,
          };
        }
      }
    } else if (qtdOperacoes > 0) {
      for (let i = 0; i < Math.min(qtdOperacoes, slots); i++) {
        base[i] = { prepMin: 0, prodMin: 0 };
      }
    }

    return base;
  }

  private async carregarOp(id: number) {
    const op = await this.prisma.ordemProducao.findUnique({
      where: { id },
      include: this.includeOpCompleto(),
    });
    if (!op) {
      throw new NotFoundException(`OP ${id} não encontrada`);
    }
    return op;
  }

  private includeOpCompleto() {
    return {
      produto: { include: { grupo: true, classificacao: true } },
      operacoes: { orderBy: { numeroOperacao: 'asc' as const } },
    };
  }

  private resolverEquipamentoOperacao(
    procOp: ProcessoOperacao,
    override?: CreateOpOperacaoDto,
  ) {
    const alternativas = this.parseAlternativas(procOp.equipamentosTab);
    const vazio = {
      equipamentoGrupo: null as number | null,
      equipamentoCodigo: null as number | null,
      indice: null as number | null,
      ferramentaFabrica: null as string | null,
      ferramentaNumero: null as string | null,
      ferramentaMatricula: null as number | null,
    };

    if (override?.equipamentoGrupo != null && override.equipamentoCodigo != null) {
      const alt =
        override.indice && override.indice > 0
          ? alternativas[override.indice - 1]
          : alternativas.find(
              (a) =>
                a.equipamentoGrupo === override.equipamentoGrupo &&
                a.equipamentoCodigo === override.equipamentoCodigo,
            );
      return {
        equipamentoGrupo: override.equipamentoGrupo,
        equipamentoCodigo: override.equipamentoCodigo,
        indice: override.indice ?? null,
        ferramentaFabrica: alt?.ferramentaFabrica ?? null,
        ferramentaNumero: alt?.ferramentaNumero ?? null,
        ferramentaMatricula: alt?.ferramentaMatricula ?? null,
      };
    }

    const indice =
      override?.indice ??
      (procOp.equipamentoEscolhido && procOp.equipamentoEscolhido > 0
        ? procOp.equipamentoEscolhido
        : alternativas.length > 0
          ? 1
          : 0);

    if (indice > 0 && alternativas[indice - 1]) {
      const alt = alternativas[indice - 1];
      return {
        equipamentoGrupo: alt.equipamentoGrupo || null,
        equipamentoCodigo: alt.equipamentoCodigo || null,
        indice,
        ferramentaFabrica: alt.ferramentaFabrica ?? null,
        ferramentaNumero: alt.ferramentaNumero ?? null,
        ferramentaMatricula: alt.ferramentaMatricula ?? null,
      };
    }

    return vazio;
  }

  private parseAlternativas(tab: unknown): EquipamentoTab[] {
    if (!Array.isArray(tab)) return [];
    return tab.filter(
      (item): item is EquipamentoTab =>
        typeof item === 'object' &&
        item != null &&
        ('equipamentoGrupo' in item || 'equipamentoCodigo' in item),
    );
  }

  private formatarHoraAgora(data: Date): string {
    return [
      String(data.getHours()).padStart(2, '0'),
      String(data.getMinutes()).padStart(2, '0'),
      String(data.getSeconds()).padStart(2, '0'),
    ].join(':');
  }

  private buildWhere(
    search?: string,
    aberta?: string,
  ): Prisma.OrdemProducaoWhereInput {
    const and: Prisma.OrdemProducaoWhereInput[] = [];

    if (aberta === 'true') {
      and.push({ baixada: false });
    } else if (aberta === 'false') {
      and.push({ baixada: true });
    }

    if (search?.trim()) {
      const term = search.trim();
      const asNumber = parseInt(term, 10);
      const or: Prisma.OrdemProducaoWhereInput[] = [
        { produtoCodigo: { contains: term, mode: 'insensitive' } },
        { clienteNome: { contains: term, mode: 'insensitive' } },
        { tipo: { contains: term, mode: 'insensitive' } },
      ];
      if (!Number.isNaN(asNumber)) {
        or.push({ codigo: asNumber });
      }
      and.push({ OR: or });
    }

    return and.length ? { AND: and } : {};
  }

  private async resolverProduto(produtoCodigo: string) {
    const limpo = produtoCodigo.trim();
    return this.prisma.produto.findFirst({
      where: {
        OR: [
          { desenhoCliente: limpo },
          {
            desenhoSparta: {
              contains: limpo.replace(/\./g, ''),
              mode: 'insensitive',
            },
          },
        ],
      },
      include: { grupo: true, classificacao: true },
    });
  }
}
