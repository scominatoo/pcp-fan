import { MateriaPrima } from '@prisma/client';
import { decimalToString } from '../common/serialize-decimal';

/** Código legado: I0100001 */
export function formatarCodigoMateriaPrima(mp: MateriaPrima): string {
  return (
    mp.classeLetra +
    String(mp.classeNumero).padStart(2, '0') +
    String(mp.itemCodigo).padStart(5, '0')
  );
}

export function serializeMateriaPrima(mp: MateriaPrima) {
  return {
    id: mp.id,
    codigo: formatarCodigoMateriaPrima(mp),
    classeLetra: mp.classeLetra,
    classeNumero: mp.classeNumero,
    itemCodigo: mp.itemCodigo,
    descricao: mp.descricao,
    unidade: mp.unidade,
    espessura: decimalToString(mp.espessura),
    comprimento: mp.comprimento,
    largura: decimalToString(mp.largura),
    qualidade: mp.qualidade,
    dureza: mp.dureza,
    quantidade: decimalToString(mp.quantidade),
    estoqueMin: decimalToString(mp.estoqueMin),
    estoqueMax: decimalToString(mp.estoqueMax),
    createdAt: mp.createdAt,
    updatedAt: mp.updatedAt,
  };
}
