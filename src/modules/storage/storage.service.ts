import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../../supabase/supabase.service';

const ALLOWED_BUCKETS = ['receipts', 'profile-images', 'content-images'] as const;
type StorageBucket = (typeof ALLOWED_BUCKETS)[number];

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class StorageService {
  constructor(private readonly supabase: SupabaseService) {}

  async uploadFile(
    accessToken: string,
    bucket: StorageBucket,
    file: Express.Multer.File,
    folder?: string,
  ) {
    const { data: userData, error: userError } =
      await this.supabase.anon.auth.getUser(accessToken);

    if (userError || !userData.user) {
      throw new UnauthorizedException('Geçersiz oturum');
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      throw new BadRequestException('Geçersiz bucket');
    }

    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Desteklenmeyen dosya tipi');
    }

    const basePath = folder ?? userData.user.id;
    const objectPath = `${basePath}/${randomUUID()}.${ext}`;

    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client.storage
      .from(bucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const { data: publicUrlData } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);

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
