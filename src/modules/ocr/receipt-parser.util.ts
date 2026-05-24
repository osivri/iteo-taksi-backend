export interface ReceiptOcrResult {
  amount: number | null;
  recordDate: string | null;
  merchant: string | null;
  category: string | null;
  rawText: string;
  confidence: number;
  provider: string;
}

const CATEGORY_KEYWORDS: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['yakıt', 'yakit', 'benzin', 'motorin', 'lpg', 'otogaz', 'shell', 'opet', 'bp', 'petrol'], category: 'Yakıt' },
  { keywords: ['bakım', 'bakim', 'servis', 'oto servis', 'lastik', 'yağ değişim'], category: 'Araç Bakım' },
  { keywords: ['yemek', 'restoran', 'cafe', 'kahve', 'lokanta'], category: 'Yemek' },
  { keywords: ['otopark', 'park', 'köprü', 'otoyol', 'hgs', 'ogs'], category: 'Ulaşım' },
  { keywords: ['temizlik', 'detay', 'yıkama'], category: 'Temizlik' },
  { keywords: ['sigorta', 'kasko', 'trafik'], category: 'Sigorta' },
  { keywords: ['aidat', 'üyelik', 'oda'], category: 'Aidat' },
];

const TOTAL_KEYWORDS = ['toplam', 'genel toplam', 'tutar', 'ödenecek', 'kdv dahil', 'net tutar'];

function parseTurkishAmount(raw: string): number | null {
  const normalized = raw.replace(/\s/g, '');
  const match = normalized.match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2}|\d+)/);
  if (!match) return null;

  let value = match[1];
  if (value.includes(',')) {
    value = value.replace(/\./g, '').replace(',', '.');
  }
  const num = parseFloat(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : null;
}

function extractAmount(text: string): number | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let best: number | null = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const isTotalLine = TOTAL_KEYWORDS.some((k) => lower.includes(k));
    const amounts = [...line.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*(?:tl|₺)?/gi)].map((m) =>
      parseTurkishAmount(m[1]),
    );

    for (const amount of amounts) {
      if (amount === null) continue;
      if (isTotalLine) return amount;
      if (best === null || amount > best) best = amount;
    }
  }

  return best;
}

function extractDate(text: string): string | null {
  const match = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})(?:\s+\d{1,2}:\d{2})?/);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  let year = match[3];
  if (year.length === 2) year = `20${year}`;

  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

function extractMerchant(text: string): string | null {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  const skip = /^(fiş|fis|tarih|saat|toplam|kdv|vergi|tel|adres|www\.|http)/i;
  for (const line of lines.slice(0, 5)) {
    if (!skip.test(line) && line.length <= 60) return line;
  }
  return null;
}

function suggestCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.category;
  }
  return 'Diğer';
}

export function parseReceiptText(rawText: string, provider: string, confidence: number): ReceiptOcrResult {
  const text = rawText.trim();
  return {
    amount: extractAmount(text),
    recordDate: extractDate(text),
    merchant: extractMerchant(text),
    category: suggestCategory(text),
    rawText: text,
    confidence,
    provider,
  };
}
