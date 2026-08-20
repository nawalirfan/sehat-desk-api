import jwt from 'jsonwebtoken';

const TOKEN_EXPIRY = '12h';

export interface SessionTokenPayload {
  sub: 'admin';
}

// No session table on purpose, a signed token with an expiry is all the session this needs.
export function signSessionToken(secret: string): string {
  return jwt.sign({ sub: 'admin' } satisfies SessionTokenPayload, secret, { expiresIn: TOKEN_EXPIRY });
}

export function verifySessionToken(token: string, secret: string): SessionTokenPayload {
  return jwt.verify(token, secret) as SessionTokenPayload;
}
