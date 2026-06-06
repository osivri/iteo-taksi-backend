const SIGNATURES: { mime: string; match: (buf: Buffer) => boolean }[] = [
  {
    mime: 'image/jpeg',
    match: (buf) => buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8,
  },
  {
    mime: 'image/png',
    match: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47,
  },
  {
    mime: 'image/webp',
    match: (buf) =>
      buf.length >= 12 &&
      buf.slice(0, 4).toString('ascii') === 'RIFF' &&
      buf.slice(8, 12).toString('ascii') === 'WEBP',
  },
  {
    mime: 'application/pdf',
    match: (buf) => buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-',
  },
];

export function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (sig.match(buffer)) return sig.mime;
  }
  return null;
}

export function assertMimeMatchesBuffer(
  buffer: Buffer,
  claimedMime: string,
): string {
  const detected = detectMimeFromBuffer(buffer);
  if (!detected) {
    throw new Error('Dosya içeriği tanınamadı');
  }
  if (detected !== claimedMime) {
    throw new Error('Bildirilen dosya tipi ile içerik uyuşmuyor');
  }
  return detected;
}
