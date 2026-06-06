import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AuditService {
  constructor(private readonly supabase: SupabaseService) {}

  async log(
    actorId: string | null,
    action: string,
    entityType: string,
    entityId?: string,
    metadata: Record<string, unknown> = {},
  ) {
    await this.supabase.admin.from('audit_logs').insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata,
    });
  }

  async list(page = 1, limit = 50) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await this.supabase.admin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return {
      items: (data ?? []).map((row) => ({
        id: row.id,
        actorId: row.actor_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        metadata: row.metadata,
        createdAt: row.created_at,
      })),
      meta: { page, limit, total: count ?? 0 },
    };
  }
}
