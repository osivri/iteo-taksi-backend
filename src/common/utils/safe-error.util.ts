const SUPABASE_PATTERNS = [
  /relation "[^"]+" does not exist/i,
  /column "[^"]+" does not exist/i,
  /permission denied/i,
  /row-level security/i,
  /violates .* constraint/i,
  /duplicate key value/i,
  /invalid input syntax/i,
  /JWT expired/i,
  /Invalid API key/i,
  /PostgREST/i,
  /PGRST/i,
];

export function toClientMessage(
  message: string | string[] | undefined,
  status: number,
): string {
  const raw = Array.isArray(message) ? message.join(', ') : (message ?? 'Beklenmeyen bir hata oluştu');

  if (status >= 500) {
    return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
  }

  if (SUPABASE_PATTERNS.some((pattern) => pattern.test(raw))) {
    return 'İşlem tamamlanamadı. Lütfen bilgilerinizi kontrol edin.';
  }

  return raw;
}
