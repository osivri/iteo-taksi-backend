import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UploadFileDto } from './dto/upload-file.dto';
import type { StorageBucket } from './storage-bucket.config';

function uploadInterceptor(maxBytes: number) {
  return FileInterceptor('file', { limits: { fileSize: maxBytes } });
}

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  private async handleUpload(
    user: AuthUser,
    file: Express.Multer.File,
    bucket: StorageBucket,
  ) {
    const data = await this.storageService.uploadFile(user, bucket, file);
    return { success: true, data };
  }

  @Post('receipts')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Fiş / makbuz yükle (receipts bucket)' })
  @UseInterceptors(uploadInterceptor(5 * 1024 * 1024))
  async uploadReceipt(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.handleUpload(user, file, 'receipts');
  }

  @Post('profile-images')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Profil görseli yükle' })
  @UseInterceptors(uploadInterceptor(2 * 1024 * 1024))
  async uploadProfileImage(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.handleUpload(user, file, 'profile-images');
  }

  @Post('forgotten-items')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Unutulan eşya görseli yükle' })
  @UseInterceptors(uploadInterceptor(5 * 1024 * 1024))
  async uploadForgottenItem(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.handleUpload(user, file, 'forgotten-items');
  }

  @Post('content-images')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'İçerik görseli yükle (yalnızca admin)' })
  @UseInterceptors(uploadInterceptor(5 * 1024 * 1024))
  async uploadContentImage(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.handleUpload(user, file, 'content-images');
  }

  /** @deprecated bucket-specific endpoint kullanın: /storage/receipts vb. */
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Deprecated] Bucket alanına göre yönlendirir' })
  @UseInterceptors(uploadInterceptor(5 * 1024 * 1024))
  async uploadLegacy(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.handleUpload(user, file, dto.bucket);
  }
}
