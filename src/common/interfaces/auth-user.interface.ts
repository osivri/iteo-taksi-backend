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
  createdAt: string;
  updatedAt: string;
}

export function mapProfile(row: ProfileRow): ProfileResponse {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    nationalId: row.national_id,
    memberNo: row.member_no,
    role: row.role,
    status: row.status,
    profileImageUrl: row.profile_image_url,
    kvkkAcceptedAt: row.kvkk_accepted_at ?? null,
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
