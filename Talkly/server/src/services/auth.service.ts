import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

interface TokenClaims {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies TokenClaims, env.jwtSecret, { expiresIn: '30d' });
}

/** Возвращает userId или null. Токен несёт только id — профиль всегда из БД. */
export function verifyToken(token: string): string | null {
  try {
    const { sub } = jwt.verify(token, env.jwtSecret) as TokenClaims;
    return sub;
  } catch {
    return null;
  }
}
