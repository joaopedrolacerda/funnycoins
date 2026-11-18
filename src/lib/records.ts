// Registros no formato do contrato da API (shared/API.md), iguais aos de SyncModels.swift.
// Dinheiro em centavos e datas em milissegundos desde 1970.

export interface ProfileData {
  monthlyEssentialCostCents: number;
  targetMonths: number;
  investPercent: number;
  petName: string;
  petColor: string;
  createdAt: number;
}

export interface CashEntryData {
  title: string;
  amountCents: number;
  date: number;
  kind: 'income' | 'expense';
  category: string;
}

export interface BillData {
  name: string;
  amountCents: number;
  dueDay: number;
  /** Meses pagos no formato "aaaa-mm". */
  paidMonths: string[];
  createdAt: number;
}

export interface ReserveMovementData {
  /** Positivo é depósito, negativo é retirada. */
  amountCents: number;
  date: number;
  note: string;
}

export interface InvestmentData {
  name: string;
  modality: string;
  amountCents: number;
  date: number;
}

export interface DataByKind {
  profile: ProfileData;
  cashEntry: CashEntryData;
  bill: BillData;
  reserveMovement: ReserveMovementData;
  investment: InvestmentData;
}

export type SyncKind = keyof DataByKind;

export const syncKinds: SyncKind[] = ['profile', 'cashEntry', 'bill', 'reserveMovement', 'investment'];

export interface SyncRecord<K extends SyncKind = SyncKind> {
  id: string;
  kind: K;
  updatedAt: number;
  /** Omitido ou null quando ativo. Exclusões nunca apagam o registro. */
  deletedAt?: number | null;
  data: DataByKind[K];
}

export function isActive(record: SyncRecord): boolean {
  return record.deletedAt == null;
}
