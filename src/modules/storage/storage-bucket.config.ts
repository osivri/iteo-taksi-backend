import type { UserRole } from '../../common/interfaces/auth-user.interface';

export const STORAGE_BUCKETS = [
  'receipts',
  'profile-images',
  'content-images',
  'forgotten-items',
  'verification-documents',
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

export const BUCKET_ACCESS: Record<
  StorageBucket,
  { roles: UserRole[]; mimes: string[]; maxBytes: number }
> = {
  receipts: {
    roles: ['USER', 'DRIVER', 'PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'],
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxBytes: 5 * 1024 * 1024,
  },
  'profile-images': {
    roles: ['USER', 'DRIVER', 'PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'],
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 2 * 1024 * 1024,
  },
  'content-images': {
    roles: ['ADMIN', 'SUPER_ADMIN'],
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 5 * 1024 * 1024,
  },
  'forgotten-items': {
    roles: ['USER', 'DRIVER', 'PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'],
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 5 * 1024 * 1024,
  },
  'verification-documents': {
    roles: ['USER', 'DRIVER', 'PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'],
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxBytes: 5 * 1024 * 1024,
  },
};

export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
