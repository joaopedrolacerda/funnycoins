// Apoio aos testes: carrega o WASM das regras fora do navegador e monta um store controlado.

import { readFileSync } from 'node:fs';
import { loadRulesSync } from './game';
import { memoryStorage, RecordStore } from './store.svelte';

let loaded = false;

export function loadRulesForTests(): void {
  if (loaded) return;
  loadRulesSync(readFileSync(new URL('./rules/pkg/rules_bg.wasm', import.meta.url)));
  loaded = true;
}

/** Meio-dia local do dia, como nos testes do app. */
export function day(year: number, month: number, date: number): number {
  return new Date(year, month - 1, date, 12).getTime();
}

/** Store em memória com relógio manual e identificadores previsíveis. */
export function testStore(start = day(2026, 10, 15)) {
  let now = start;
  let counter = 0;
  const storage = memoryStorage();
  const store = new RecordStore({
    storage,
    clock: () => now,
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
  });
  return {
    store,
    storage,
    advance(ms: number) {
      now += ms;
    },
    get now() {
      return now;
    },
  };
}
