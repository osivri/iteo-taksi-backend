import type { UserRole } from '../interfaces/auth-user.interface';

export const ADMIN_MODULES = [
  'dashboard',
  'users',
  'announcements',
  'news',
  'appointments',
  'payments',
  'finance',
  'ohs',
  'notifications',
  'stands',
  'listings',
  'service-requests',
  'spare-parts',
  'staff-expenses',
  'reminders',
  'forgotten-items',
  'audit',
] as const;

export type AdminModule = (typeof ADMIN_MODULES)[number];

/** SUPER_ADMIN tüm modüllere erişir; ADMIN yalnızca bu listedekilere. */
export const ADMIN_ROLE_MODULES: Record<'ADMIN' | 'SUPER_ADMIN', AdminModule[] | '*'> = {
  SUPER_ADMIN: '*',
  ADMIN: [
    'dashboard',
    'announcements',
    'news',
    'appointments',
    'notifications',
    'stands',
    'listings',
    'service-requests',
    'forgotten-items',
    'ohs',
    'reminders',
  ],
};

export function canAccessAdminModule(role: UserRole, module: AdminModule): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (role !== 'ADMIN') return false;
  const allowed = ADMIN_ROLE_MODULES.ADMIN;
  return allowed.includes(module);
}
