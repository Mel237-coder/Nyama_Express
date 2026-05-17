import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '@djossfood/database';

export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole as UserRole)) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    next();
  };
}