import { SetMetadata } from '@nestjs/common';
import type { Role } from '@repo/shared-schemas';

export const ROLES_KEY = 'kb_roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
