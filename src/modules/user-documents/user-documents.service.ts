import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateUserDocumentDto, ReviewUserDocumentDto } from './dto/user-document.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';

function mapDocument(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    fileUrl: row.file_url as string,
    status: row.status as string,
    adminNote: row.admin_note as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class UserDocumentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listMine(user: AuthUser) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map(mapDocument);
  }

  async create(user: AuthUser, dto: CreateUserDocumentDto) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('user_documents')
      .insert({
        user_id: user.id,
        type: dto.type,
        file_url: dto.fileUrl,
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapDocument(data);
  }

  async adminListByUser(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map(mapDocument);
  }

  async adminListPending(page = 1, limit = 20) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const { data, error, count } = await this.supabase.admin
      .from('user_documents')
      .select('*', { count: 'exact' })
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);
    return {
      items: (data ?? []).map(mapDocument),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminReview(id: string, dto: ReviewUserDocumentDto) {
    const { data: existing, error: findError } = await this.supabase.admin
      .from('user_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) throw new NotFoundException('Belge bulunamadı');

    const { data, error } = await this.supabase.admin
      .from('user_documents')
      .update({
        status: dto.status,
        admin_note: dto.adminNote ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'Belge güncellenemedi');

    if (dto.status === 'APPROVED') {
      const { data: docs } = await this.supabase.admin
        .from('user_documents')
        .select('status')
        .eq('user_id', existing.user_id);

      const allApproved = (docs ?? []).every((d) => d.status === 'APPROVED');
      if (allApproved && (docs ?? []).length > 0) {
        await this.supabase.admin
          .from('profiles')
          .update({ status: 'ACTIVE' })
          .eq('id', existing.user_id)
          .eq('status', 'PENDING_VERIFICATION');
      }
    }

    return mapDocument(data);
  }

  async getById(user: AuthUser, id: string) {
    const doc = await this.getRaw(id);
    if (doc.user_id !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu belgeye erişim yetkiniz yok');
    }
    return mapDocument(doc);
  }

  private async getRaw(id: string) {
    const { data, error } = await this.supabase.admin
      .from('user_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Belge bulunamadı');
    return data;
  }
}
