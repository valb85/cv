import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;

/**
 * scrypt from node:crypto rather than argon2. argon2 is a node-gyp native
 * module, and for one admin account the practical difference is negligible
 * against the cost of another compiled dependency in the image.
 */
export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');

  return `scrypt$${salt}$${derived}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  const [scheme, salt, expected] = stored.split('$');

  if (scheme !== 'scrypt' || !salt || !expected) {
    return false;
  }

  const actual = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (expectedBuffer.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(actual, expectedBuffer);
};
