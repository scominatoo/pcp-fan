import { Decimal } from '@prisma/client/runtime/library';

/** Converte campos Decimal do Prisma para string (JSON seguro). */
export function decimalToString(
  value: Decimal | null | undefined,
): string | null {
  if (value == null) return null;
  return value.toString();
}
