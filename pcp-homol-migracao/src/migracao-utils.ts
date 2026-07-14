/**
 * Utilitários compartilhados pelos scripts de migração.
 */

/** Converte data COBOL (ano/mês/dia) em Date ou null se inválida. */
export function dataCobol(
  ano: number,
  mes: number,
  dia: number,
): Date | null {
  if (ano < 1900 || ano > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** Formata hora COBOL HH:MM:SS */
export function horaCobol(hr: number, mn: number, sg: number): string | null {
  if (hr === 0 && mn === 0 && sg === 0) return null;
  return [
    String(hr).padStart(2, '0'),
    String(mn).padStart(2, '0'),
    String(sg).padStart(2, '0'),
  ].join(':');
}

/** Segundos totais a partir de HR/MN/SG COBOL */
export function segundosCobol(hr: number, mn: number, sg: number): number | null {
  if (hr === 0 && mn === 0 && sg === 0) return null;
  return hr * 3600 + mn * 60 + sg;
}

/** Remove bytes nulos e caracteres de controle de strings legadas */
export function sanitizarTexto(valor: string): string {
  return valor.replace(/[\x00-\x1f]/g, '').trim();
}

/** Normaliza código de produto legado */
export function normalizarProdutoCodigo(raw: string): string {
  return sanitizarTexto(raw);
}

/**
 * Monta chave compacta para lookup: GGGCCIIIII (10 dígitos)
 * a partir de grupo(3) + classificação(2) + item(5).
 */
export function chaveProdutoCompacta(
  grupo: number,
  classificacao: number,
  item: number,
): string {
  return [
    String(grupo).padStart(3, '0'),
    String(classificacao).padStart(2, '0'),
    String(item).padStart(5, '0'),
  ].join('');
}

/**
 * Tenta interpretar OP-PRODUTO / PROCESSO-PRODUTO (X15) como chave compacta.
 * Aceita "90531014", "0090531014", "009-05-31014", etc.
 */
export function parseProdutoLegado(codigo: string): {
  grupo: number;
  classificacao: number;
  item: number;
} | null {
  const limpo = normalizarProdutoCodigo(codigo);
  if (!limpo) return null;

  const comTracos = limpo.match(/^(\d{1,3})-(\d{1,2})-(\d{1,5})$/);
  if (comTracos) {
    return {
      grupo: parseInt(comTracos[1], 10),
      classificacao: parseInt(comTracos[2], 10),
      item: parseInt(comTracos[3], 10),
    };
  }

  const digitos = limpo.replace(/\D/g, '');
  if (digitos.length < 8) return null;

  const padded = digitos.padStart(10, '0').slice(-10);
  return {
    grupo: parseInt(padded.slice(0, 3), 10),
    classificacao: parseInt(padded.slice(3, 5), 10),
    item: parseInt(padded.slice(5, 10), 10),
  };
}

/** Parseia PIC 9(n)V9(m) de campo texto COBOL */
export function parseDecimalCobol(
  raw: string,
  casasDecimais: number,
): string | null {
  const digitos = raw.replace(/\D/g, '');
  if (!digitos || /^0+$/.test(digitos)) return null;
  const padded = digitos.padStart(casasDecimais + 1, '0');
  const intPart = padded.slice(0, -casasDecimais) || '0';
  const decPart = padded.slice(-casasDecimais);
  const valor = parseFloat(intPart + '.' + decPart);
  if (Number.isNaN(valor) || valor > 999.999) return null;
  return valor.toFixed(casasDecimais);
}

/** Flag S/N COBOL → boolean */
export function flagSn(valor: string): boolean {
  return valor.trim().toUpperCase() === 'S';
}

/** Extrai MPs do layout PCPA70I */
export function extrairMpsProcesso(r: Record<string, string | number>) {
  const mps = [];
  for (let i = 1; i <= 5; i++) {
    const classe = String(r[`mp${i}Classe`]).trim();
    const item = r[`mp${i}Item`] as number;
    const peso = String(r[`mp${i}Peso`]).trim();
    if (!classe && item === 0) continue;
    const letra = classe.charAt(0) || ' ';
    const numero = parseInt(classe.slice(1), 10) || 0;
    mps.push({
      classeLetra: letra,
      classeNumero: numero,
      itemCodigo: item,
      peso: peso || null,
    });
  }
  return mps.length ? mps : null;
}

/** Parseia bloco PROC-OP-TAB (360 bytes) em array de alternativas */
export function parseTabEquipamentos(tabRaw: string) {
  const tab = [];
  for (let i = 0; i < 15; i++) {
    const chunk = tabRaw.slice(i * 24, (i + 1) * 24);
    const equipamentoGrupo = parseInt(chunk.slice(0, 2).replace(/\s/g, ''), 10) || 0;
    const equipamentoCodigo = parseInt(chunk.slice(2, 6).replace(/\s/g, ''), 10) || 0;
    const ferramentaFabrica = chunk.charAt(6).trim();
    const ferramentaNumero = chunk.slice(7, 22).trim();
    const ferramentaMatricula =
      parseInt(chunk.slice(22, 24).replace(/\s/g, ''), 10) || 0;
    if (
      equipamentoGrupo === 0 &&
      equipamentoCodigo === 0 &&
      !ferramentaNumero
    ) {
      continue;
    }
    tab.push({
      equipamentoGrupo,
      equipamentoCodigo,
      ferramentaFabrica: ferramentaFabrica ? sanitizarTexto(ferramentaFabrica) : null,
      ferramentaNumero: ferramentaNumero ? sanitizarTexto(ferramentaNumero) : null,
      ferramentaMatricula: ferramentaMatricula || null,
    });
  }
  return tab.length ? tab : null;
}
