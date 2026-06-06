import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_MODULE_KEY } from '../decorators/admin-module.decorator';
import {
  canAccessAdminModule,
  type AdminModule,
} from '../config/admin-module-permissions';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class AdminModuleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const module = this.reflector.getAllAndOverride<AdminModule | undefined>(
      ADMIN_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!module) return true;

    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;

    if (!user || !canAccessAdminModule(user.role, module)) {
      throw new ForbiddenException('Bu admin modülüne erişim yetkiniz yok');
    }

    return true;
  }
}
