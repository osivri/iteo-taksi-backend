import type { Database } from '../../supabase/database.types';

export type UserRole = Database['public']['Enums']['user_role'];
export type UserStatus = Database['public']['Enums']['user_status'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface AuthUser {
  id: string;
  email: string | null;
  accessToken: string;
  role: UserRole;
  profile: ProfileRow;
}

export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  memberNo: string | null;
  role: UserRole;
  status: UserStatus;
  profileImageUrl: string | null;
  kvkkAcceptedAt: string | null;
  city: string | null;
  district: string | null;
  addressLine: string | null;
  pushNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function maskNationalId(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return '****';
  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function mapProfile(row: ProfileRow, options?: { includeNationalId?: boolean }): ProfileResponse {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    nationalId: options?.includeNationalId ? row.national_id : maskNationalId(row.national_id),
    memberNo: row.member_no,
    role: row.role,
    status: row.status,
    profileImageUrl: row.profile_image_url,
    kvkkAcceptedAt: row.kvkk_accepted_at ?? null,
    city: row.city ?? null,
    district: row.district ?? null,
    addressLine: row.address_line ?? null,
    pushNotificationsEnabled: row.push_notifications_enabled !== false,
    smsNotificationsEnabled: row.sms_notifications_enabled !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function extractBearerToken(authorization?: string): string | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice(7);
}
