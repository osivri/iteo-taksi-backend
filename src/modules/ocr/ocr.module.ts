import { Module } from '@nestjs/common';
import { OcrQueueService } from './ocr-queue.service';
import { ReceiptOcrService } from './receipt-ocr.service';

@Module({
  providers: [OcrQueueService, ReceiptOcrService],
  exports: [OcrQueueService, ReceiptOcrService],
})
export class OcrModule {}
