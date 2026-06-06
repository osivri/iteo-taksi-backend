import { parseSupabaseStoragePath } from './supabase-storage-path.util';

describe('parseSupabaseStoragePath', () => {
  it('accepts Supabase public storage URLs', () => {
    const result = parseSupabaseStoragePath(
      'https://example.supabase.co/storage/v1/object/public/receipts/user-1/file.jpg',
    );
    expect(result).toEqual({ bucket: 'receipts', path: 'user-1/file.jpg' });
  });

  it('rejects external URLs', () => {
    expect(parseSupabaseStoragePath('https://evil.example.com/image.jpg')).toBeNull();
  });
});
