import { OcrQueueService } from './ocr-queue.service';

describe('OcrQueueService', () => {
  it('serializes concurrent OCR jobs', async () => {
    const queue = new OcrQueueService();
    const order: number[] = [];

    const first = queue.run(async () => {
      order.push(1);
      await new Promise((r) => setTimeout(r, 30));
      order.push(2);
      return 'a';
    });

    const second = queue.run(async () => {
      order.push(3);
      return 'b';
    });

    await Promise.all([first, second]);
    expect(order).toEqual([1, 2, 3]);
  });
});
