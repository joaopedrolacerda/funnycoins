// Datas trafegam em milissegundos. As regras trabalham com o dia do calendário local.

const pad = (value: number, size = 2) => String(value).padStart(size, '0');

/** Dia local no formato "aaaa-mm-dd", usado pelas regras e pelos campos de data. */
export function civilDate(ms: number): string {
  const date = new Date(ms);
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Mês local no formato "aaaa-mm", igual a `Bill.monthKey` no app. */
export function monthKey(ms: number): string {
  return civilDate(ms).slice(0, 7);
}

/** Meio-dia local do dia "aaaa-mm-dd". Meio-dia evita trocar de dia com o horário de verão. */
export function msFromCivil(text: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getMonth() === month - 1 ? date.getTime() : null;
}

const shortDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Ex.: "15 de out. de 2026". */
export function formatDate(ms: number): string {
  return shortDate.format(ms);
}
