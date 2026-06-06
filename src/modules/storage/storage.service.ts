import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { assertMimeMatchesBuffer } from '../../common/utils/file-magic.util';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  BUCKET_ACCESS,
  MIME_TO_EXT,
  type StorageBucket,
} from './storage-bucket.config';

@Injectable()
export class StorageService {
  constructor(private readonly supabase: SupabaseService) {}

  async uploadFile(user: AuthUser, bucket: StorageBucket, file: Express.Multer.File) {
    const rules = BUCKET_ACCESS[bucket];
    if (!rules.roles.includes(user.role)) {
      throw new ForbiddenException('Bu bucket için yükleme yetkiniz yok');
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('Dosya gerekli');
    }

    if (file.size > rules.maxBytes) {
      throw new BadRequestException('Dosya boyutu limiti aşıldı');
    }

    if (!rules.mimes.includes(file.mimetype)) {
      throw new BadRequestException('Desteklenmeyen dosya tipi');
    }

    try {
      assertMimeMatchesBuffer(file.buffer, file.mimetype);
    } catch {
      throw new BadRequestException('Dosya içeriği bildirilen tiple uyuşmuyor');
    }

    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Desteklenmeyen dosya tipi');
    }

    const objectPath = `${user.id}/${randomUUID()}.${ext}`;
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client.storage
      .from(bucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(data.path);

    return {
      bucket,
      path: data.path,
      url: publicUrlData.publicUrl,
    };
  }

  async getSignedUrl(
    accessToken: string,
    bucket: StorageBucket,
    path: string,
    expiresIn = 3600,
  ) {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { signedUrl: data.signedUrl };
  }
}
