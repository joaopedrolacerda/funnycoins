// Dinheiro sempre no formato brasileiro, independente do idioma do navegador.
// Valores são inteiros em centavos: nunca ponto flutuante para guardar dinheiro.

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
const decimal1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Ex.: 123456 → "R$ 1.234,56". */
export function brl(cents: number): string {
  // Divide só para exibir; o valor guardado continua em centavos.
  return currency.format(cents / 100);
}

/** Ex.: 0.25 → "25%". */
export function pct(fraction: number): string {
  return percent.format(fraction);
}

/** Ex.: 2.5 → "2,5". */
export function oneDecimal(value: number): string {
  return decimal1.format(value);
}

/** Maior valor aceito na digitação: R$ 9.999.999.999,99. */
export const MAX_CENTS = 999_999_999_999;

/**
 * Lê o que foi digitado como nas maquininhas: os dígitos enchem os centavos da direita para a esquerda.
 * "1234" → 1234 centavos (R$ 12,34). Qualquer coisa que não seja dígito é ignorada.
 */
export function centsFromTyping(text: string): number {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, String(MAX_CENTS).length);
  return digits === '' ? 0 : Math.min(Number(digits), MAX_CENTS);
}
