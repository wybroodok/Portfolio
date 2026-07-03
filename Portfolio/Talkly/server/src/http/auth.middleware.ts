import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { getUserById } from '../services/user.service.js';
import type { UserProfile } from '../../../shared/events.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

/** Требует валидный Bearer-токен; кладёт профиль в req.user. */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const user = await getUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'user not found' });
    return;
  }
  req.user = user;
  next();
}
