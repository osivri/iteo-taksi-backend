import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWorker } from 'tesseract.js';
import { SupabaseService } from '../../supabase/supabase.service';
import { parseReceiptText, type ReceiptOcrResult } from './receipt-parser.util';

@Injectable()
export class ReceiptOcrService {
  private readonly logger = new Logger(ReceiptOcrService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  async scanImage(imageUrl: string): Promise<ReceiptOcrResult> {
    const buffer = await this.downloadImage(imageUrl);
    const provider = this.config.get<string>('OCR_PROVIDER', 'tesseract');

    if (provider === 'mock') {
      return parseReceiptText(this.mockReceiptText(), 'mock', 0.55);
    }

    try {
      const rawText = await this.runTesseract(buffer);
      const confidence = rawText.length > 20 ? 0.82 : 0.45;
      return parseReceiptText(rawText, 'tesseract', confidence);
    } catch (err) {
      this.logger.warn(`OCR failed, falling back to mock: ${(err as Error).message}`);
      return parseReceiptText(this.mockReceiptText(), 'mock-fallback', 0.35);
    }
  }

  private mockReceiptText(): string {
    const amount = (Math.random() * 400 + 50).toFixed(2).replace('.', ',');
    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
    return `SHELL PETROL\nTaksici Yakıt Fişi\nTarih: ${date}\nÜrün: Motorin\nLitre: 32,45\nAra Toplam: ${amount} TL\nKDV %20\nGENEL TOPLAM: ${amount} TL\nTeşekkürler`;
  }

  private async runTesseract(buffer: Buffer): Promise<string> {
    const worker = await createWorker('tur+eng');
    try {
      const { data } = await worker.recognize(buffer);
      return data.text ?? '';
    } finally {
      await worker.terminate();
    }
  }

  private async downloadImage(imageUrl: string): Promise<Buffer> {
    const storagePath = this.parseSupabaseStoragePath(imageUrl);
    if (storagePath) {
      const { data, error } = await this.supabase.admin.storage
        .from(storagePath.bucket)
        .download(storagePath.path);
      if (!error && data) {
        return Buffer.from(await data.arrayBuffer());
      }
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new BadRequestException('Fiş görseli indirilemedi');
    }
    return Buffer.from(await response.arrayBuffer());
  }

  private parseSupabaseStoragePath(imageUrl: string): { bucket: string; path: string } | null {
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
}
