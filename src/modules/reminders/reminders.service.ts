import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { PushService } from '../push/push.service';
import { NotificationsService } from '../notifications/notifications.service';

type ReminderType = 'INSPECTION' | 'INSURANCE' | 'LICENSE';

interface ReminderCandidate {
  vehicleId: string;
  ownerId: string;
  plateNumber: string;
  reminderType: ReminderType;
  expiryDate: string;
}

const REMINDER_LABELS: Record<ReminderType, string> = {
  INSPECTION: 'Muayene',
  INSURANCE: 'Sigorta',
  LICENSE: 'Ruhsat',
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly pushService: PushService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async runDailyReminders() {
    const today = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);
    const horizonIso = horizon.toISOString().slice(0, 10);

    const { data: vehicles, error } = await this.supabase.admin
      .from('vehicles')
      .select(
        'id, plate_number, owner_id, inspection_expiry, insurance_expiry, license_expiry',
      )
      .eq('status', 'ACTIVE');

    if (error) throw new BadRequestException(error.message);

    const candidates: ReminderCandidate[] = [];

    for (const vehicle of vehicles ?? []) {
      const base = {
        vehicleId: vehicle.id as string,
        ownerId: vehicle.owner_id as string,
        plateNumber: vehicle.plate_number as string,
      };

      const inspection = vehicle.inspection_expiry as string | null;
      const insurance = vehicle.insurance_expiry as string | null;
      const license = vehicle.license_expiry as string | null;

      if (inspection && inspection <= horizonIso) {
        candidates.push({ ...base, reminderType: 'INSPECTION', expiryDate: inspection });
      }
      if (insurance && insurance <= horizonIso) {
        candidates.push({ ...base, reminderType: 'INSURANCE', expiryDate: insurance });
      }
      if (license && license <= horizonIso) {
        candidates.push({ ...base, reminderType: 'LICENSE', expiryDate: license });
      }
    }

    if (!candidates.length) {
      return { processed: 0, sent: 0, skipped: 0 };
    }

    const vehicleIds = [...new Set(candidates.map((c) => c.vehicleId))];
    const { data: existingLogs } = await this.supabase.admin
      .from('reminder_logs')
      .select('vehicle_id, reminder_type, expiry_date')
      .in('vehicle_id', vehicleIds);

    const sentKeys = new Set(
      (existingLogs ?? []).map(
        (log) =>
          `${log.vehicle_id as string}:${log.reminder_type as string}:${log.expiry_date as string}`,
      ),
    );

    const ownerIds = [...new Set(candidates.map((c) => c.ownerId))];
    const { data: allTokens } = await this.supabase.admin
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', ownerIds);

    const tokensByOwner = new Map<string, string[]>();
    for (const row of allTokens ?? []) {
      const userId = row.user_id as string;
      const token = row.token as string;
      if (!token) continue;
      const list = tokensByOwner.get(userId) ?? [];
      list.push(token);
      tokensByOwner.set(userId, list);
    }

    let sent = 0;
    let skipped = 0;

    for (const candidate of candidates) {
      const key = `${candidate.vehicleId}:${candidate.reminderType}:${candidate.expiryDate}`;
      if (sentKeys.has(key)) {
        skipped += 1;
        continue;
      }

      const label = REMINDER_LABELS[candidate.reminderType];
      const daysLeft = Math.ceil(
        (new Date(candidate.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const title = `${label} hatırlatması`;
      const body =
        daysLeft >= 0
          ? `${candidate.plateNumber} plakası için ${label} süresi ${candidate.expiryDate} tarihinde doluyor (${daysLeft} gün kaldı).`
          : `${candidate.plateNumber} plakası için ${label} süresi ${candidate.expiryDate} tarihinde doldu.`;

      try {
        await this.notificationsService.send({
          userId: candidate.ownerId,
          title,
          body,
          type: 'SYSTEM',
        });

        const pushTokens = tokensByOwner.get(candidate.ownerId) ?? [];
        if (pushTokens.length) {
          await this.pushService.sendExpoPush(
            pushTokens.map((to) => ({
              to,
              title,
              body,
              data: {
                type: 'REMINDER',
                vehicleId: candidate.vehicleId,
                reminderType: candidate.reminderType,
              },
            })),
          );
        }

        const { error: logError } = await this.supabase.admin.from('reminder_logs').insert({
          vehicle_id: candidate.vehicleId,
          owner_id: candidate.ownerId,
          reminder_type: candidate.reminderType,
          expiry_date: candidate.expiryDate,
          sent_at: new Date().toISOString(),
        });

        if (logError) {
          this.logger.warn(`Reminder log kaydı başarısız: ${logError.message}`);
        } else {
          sent += 1;
        }
      } catch (e) {
        this.logger.warn(
          `Hatırlatma gönderilemedi (${candidate.plateNumber}/${candidate.reminderType}): ${(e as Error).message}`,
        );
      }
    }

    return { processed: candidates.length, sent, skipped };
  }
}
