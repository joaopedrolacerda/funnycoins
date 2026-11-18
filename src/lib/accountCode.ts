// Código da conta: digitado pela pessoa para entrar em outro aparelho.
// Mesmo formato do backend (rust/backend/src/auth.rs): 12 caracteres em grupos de 4, como K7QM-4XPA-9RTD.

/** Letras e números aceitos, sem os que se confundem (0 e O, 1, I e L, U e V). */
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTWXYZ';
export const CODE_LENGTH = 12;

/** Formata enquanto a pessoa digita: maiúsculas, hífens a cada 4 e nada além do alfabeto. */
export function formatCodeInput(text: string): string {
  const chars = [...text.toUpperCase()].filter((char) => CODE_ALPHABET.includes(char)).slice(0, CODE_LENGTH);
  const groups: string[] = [];
  for (let index = 0; index < chars.length; index += 4) groups.push(chars.slice(index, index + 4).join(''));
  return groups.join('-');
}

/** Já tem os 12 caracteres e pode ser enviado. */
export function isCompleteCode(text: string): boolean {
  return formatCodeInput(text).replaceAll('-', '').length === CODE_LENGTH;
}
