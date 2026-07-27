import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'foodflow_super_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'restaurant' | 'customer' | 'ngo' | 'admin';
    email?: string;
    name?: string;
  };
}

/**
 * Sign a JWT token for an authenticated user
 */
export function signToken(user: { id: string; role: string; email?: string; name?: string }): string {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Express middleware to enforce JWT authentication on protected routes
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional authentication middleware - attaches user if valid token present, but does not block if missing
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
      req.user = decoded;
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}
