import { detectMimeFromBuffer, assertMimeMatchesBuffer } from './file-magic.util';

describe('file-magic.util', () => {
  it('detects JPEG magic bytes', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    expect(detectMimeFromBuffer(buf)).toBe('image/jpeg');
  });

  it('rejects spoofed MIME when content is PNG', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() => assertMimeMatchesBuffer(png, 'image/jpeg')).toThrow();
  });
});
