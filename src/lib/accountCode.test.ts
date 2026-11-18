import { describe, expect, it } from 'vitest';
import { CODE_ALPHABET, formatCodeInput, isCompleteCode } from './accountCode';

describe('código da conta', () => {
  it('formata em grupos de 4 enquanto digita', () => {
    expect(formatCodeInput('k7q')).toBe('K7Q');
    expect(formatCodeInput('k7qm4')).toBe('K7QM-4');
    expect(formatCodeInput('k7qm 4xpa 9rtd')).toBe('K7QM-4XPA-9RTD');
  });

  it('aceita o código colado com hífens e corta o excesso', () => {
    expect(formatCodeInput('K7QM-4XPA-9RTD')).toBe('K7QM-4XPA-9RTD');
    expect(formatCodeInput('K7QM-4XPA-9RTD-2222')).toBe('K7QM-4XPA-9RTD');
  });

  it('ignora letras que se confundem e símbolos', () => {
    expect(formatCodeInput('O0I1L-UV!@')).toBe('');
  });

  it('só está completo com 12 caracteres válidos', () => {
    expect(isCompleteCode('K7QM-4XPA-9RTD')).toBe(true);
    expect(isCompleteCode('K7QM-4XPA-9RT')).toBe(false);
    expect(isCompleteCode('')).toBe(false);
  });

  it('usa o mesmo alfabeto do backend', () => {
    expect(CODE_ALPHABET).toBe('23456789ABCDEFGHJKMNPQRSTWXYZ');
    expect(CODE_ALPHABET).toHaveLength(29);
  });
});
