import { readToken } from '../utils/auth.js';

export function requireAuth(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  try {
    req.userId = readToken(token).sub;
    next();
  } catch {
    res.status(401).json({ message: 'Your session is invalid or has expired.' });
  }
}