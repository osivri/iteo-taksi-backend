import { Injectable } from '@nestjs/common';
import type { ProfileRow } from '../interfaces/auth-user.interface';

interface CacheEntry {
  profile: ProfileRow;
  expiresAt: number;
}

@Injectable()
export class ProfileCacheService {
  private readonly store = new Map<string, CacheEntry>();
  private readonly ttlMs = 30_000;

  get(userId: string): ProfileRow | null {
    const entry = this.store.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(userId);
      return null;
    }
    return entry.profile;
  }

  set(userId: string, profile: ProfileRow): void {
    this.store.set(userId, { profile, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(userId: string): void {
    this.store.delete(userId);
  }
}
