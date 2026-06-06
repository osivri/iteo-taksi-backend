import { SetMetadata } from '@nestjs/common';
import type { AdminModule as AdminModuleName } from '../config/admin-module-permissions';

export const ADMIN_MODULE_KEY = 'admin_module';
export const RequireAdminModule = (module: AdminModuleName) =>
  SetMetadata(ADMIN_MODULE_KEY, module);
