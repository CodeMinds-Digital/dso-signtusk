import type { User } from '@signtusk/lib/constants/prisma-enums';
import { Role } from '@signtusk/lib/constants/prisma-enums';

export const isAdmin = (user: Pick<User, 'roles'>) => user.roles.includes(Role.ADMIN);
