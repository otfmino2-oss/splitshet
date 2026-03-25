import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key';
const JWT_EXPIRY = '15m'; // 15 minutes
const JWT_REFRESH_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token
 */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256',
  });
}

/**
 * Sign a refresh token
 */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
    algorithm: 'HS256',
  });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (use only for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get expiry time in seconds
 */
export function getTokenExpiry(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return decoded.exp - Math.floor(Date.now() / 1000);
}
