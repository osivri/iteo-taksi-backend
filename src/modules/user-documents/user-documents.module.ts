import { Module } from '@nestjs/common';
import { UserDocumentsService } from './user-documents.service';
import { UserDocumentsController } from './user-documents.controller';
import { AdminUserDocumentsController } from './admin-user-documents.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [UserDocumentsController, AdminUserDocumentsController],
  providers: [UserDocumentsService],
  exports: [UserDocumentsService],
})
export class UserDocumentsModule {}
