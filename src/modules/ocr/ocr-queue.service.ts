import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OcrQueueService {
  private readonly logger = new Logger(OcrQueueService.name);
  private tail: Promise<void> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const runTask = this.tail.then(task);
    this.tail = runTask.then(
      () => undefined,
      (err) => {
        this.logger.debug(`OCR kuyruk görevi başarısız: ${(err as Error).message}`);
      },
    );
    return runTask;
  }
}
