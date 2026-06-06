export function parseSupabaseStoragePath(
  imageUrl: string,
): { bucket: string; path: string } | null {
  const patterns = [
    /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/,
    /\/storage\/v1\/object\/([^/]+)\/(.+)$/,
  ];
  for (const pattern of patterns) {
    const match = imageUrl.split('?')[0].match(pattern);
    if (match) {
      return { bucket: match[1], path: decodeURIComponent(match[2]) };
    }
  }
  return null;
}
