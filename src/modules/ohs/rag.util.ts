export interface RagChunk {
  id: string;
  contentId: string;
  title: string;
  type: string;
  category: string;
  text: string;
}

export interface RagMatch {
  chunk: RagChunk;
  score: number;
}

const STOP_WORDS = new Set([
  'bir', 've', 'ile', 'için', 'icin', 'bu', 'da', 'de', 'mi', 'mu', 'mü', 'ne', 'nasıl', 'nasil',
  'olan', 'olarak', 'gibi', 'var', 'yok', 'the', 'and', 'for', 'are',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

export function chunkOhsContent(item: {
  id: string;
  title: string;
  type: string;
  category: string;
  description?: string | null;
  body?: string | null;
}): RagChunk[] {
  const base = `${item.title}\n${item.description ?? ''}\n${item.body ?? ''}`.trim();
  const paragraphs = base.split(/\n{2,}|(?<=[.!?])\s+/).map((p) => p.trim()).filter((p) => p.length > 20);

  if (paragraphs.length === 0) {
    return [{
      id: `${item.id}-0`,
      contentId: item.id,
      title: item.title,
      type: item.type,
      category: item.category,
      text: base || item.title,
    }];
  }

  return paragraphs.map((text, index) => ({
    id: `${item.id}-${index}`,
    contentId: item.id,
    title: item.title,
    type: item.type,
    category: item.category,
    text,
  }));
}

export function rankRagChunks(chunks: RagChunk[], query: string, limit = 3): RagMatch[] {
  const queryTokens = tokenize(query);
  const queryLower = query.toLowerCase();

  const scored = chunks.map((chunk) => {
    const haystack = `${chunk.title} ${chunk.category} ${chunk.text}`.toLowerCase();
    const chunkTokens = tokenize(haystack);
    const tokenSet = new Set(chunkTokens);

    let score = 0;
    for (const token of queryTokens) {
      if (tokenSet.has(token)) score += 2;
      if (haystack.includes(token)) score += 1;
    }

    if (queryLower.includes(chunk.title.toLowerCase().slice(0, 12))) score += 3;
    if (chunk.type === 'FAQ') score += 1;

    return { chunk, score };
  });

  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function composeRagAnswer(matches: RagMatch[]): string {
  if (matches.length === 0) return '';
  if (matches.length === 1) return matches[0].chunk.text;

  const primary = matches[0].chunk.text;
  const supplement = matches[1]?.chunk.text;
  if (supplement && supplement !== primary) {
    return `${primary}\n\n${supplement}`;
  }
  return primary;
}
