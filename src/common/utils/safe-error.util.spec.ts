import { toClientMessage } from './safe-error.util';

describe('toClientMessage', () => {
  it('masks Supabase schema errors for 4xx', () => {
    expect(toClientMessage('relation "profiles" does not exist', 400)).toBe(
      'İşlem tamamlanamadı. Lütfen bilgilerinizi kontrol edin.',
    );
  });

  it('returns generic message for 5xx', () => {
    expect(toClientMessage('internal db failure', 500)).toBe(
      'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
    );
  });

  it('passes through safe client messages', () => {
    expect(toClientMessage('Geçersiz oturum', 401)).toBe('Geçersiz oturum');
  });
});
