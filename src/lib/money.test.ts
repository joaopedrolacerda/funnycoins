import { describe, expect, it } from 'vitest';
import { brl, centsFromTyping, MAX_CENTS, oneDecimal, pct } from './money';
import { civilDate, monthKey, msFromCivil } from './dates';

// Intl usa espaço não separável entre "R$" e o valor.
const normalize = (text: string) => text.replace(/ /g, ' ');

describe('dinheiro no formato brasileiro', () => {
  it('formata centavos como R$ 1.234,56', () => {
    expect(normalize(brl(123456))).toBe('R$ 1.234,56');
    expect(normalize(brl(0))).toBe('R$ 0,00');
    expect(normalize(brl(5))).toBe('R$ 0,05');
    expect(normalize(brl(-10050))).toBe('-R$ 100,50');
  });

  it('formata porcentagem e decimal em pt-BR', () => {
    expect(pct(0.25)).toBe('25%');
    expect(oneDecimal(2.5)).toBe('2,5');
  });

  it('digitação enche os centavos da direita para a esquerda', () => {
    expect(centsFromTyping('')).toBe(0);
    expect(centsFromTyping('5')).toBe(5);
    expect(centsFromTyping('1234')).toBe(1234);
    expect(centsFromTyping('R$ 1.234,56')).toBe(123456);
    expect(centsFromTyping('00012')).toBe(12);
    expect(centsFromTyping('9'.repeat(30))).toBe(MAX_CENTS);
  });
});

describe('datas', () => {
  it('usa o dia local', () => {
    const noon = new Date(2026, 9, 5, 12).getTime();
    expect(civilDate(noon)).toBe('2026-10-05');
    expect(monthKey(noon)).toBe('2026-10');
  });

  it('lê o campo de data como meio-dia local', () => {
    const ms = msFromCivil('2026-02-28');
    expect(ms).not.toBeNull();
    expect(new Date(ms ?? 0).getHours()).toBe(12);
    expect(civilDate(ms ?? 0)).toBe('2026-02-28');
    expect(msFromCivil('2026-02-30')).toBeNull();
    expect(msFromCivil('ontem')).toBeNull();
  });
});
