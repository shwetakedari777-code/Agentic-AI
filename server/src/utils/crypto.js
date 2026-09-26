const crypto = require('crypto');
const env = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Returns a 32-byte Buffer key derived from CREDENTIAL_ENCRYPTION_KEY
 */
const getKey = () => {
  const secret = env.CREDENTIAL_ENCRYPTION_KEY || 'default-secret-fallback-key-32-b';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts a string or object using AES-256-GCM
 */
const encrypt = (data) => {
  if (!data) return null;
  const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts an AES-256-GCM encrypted string
 */
const decrypt = (encryptedString) => {
  if (!encryptedString) return null;
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted payload');
    }

    const [ivHex, tagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error.message);
    throw new Error('Failed to decrypt credentials: authentication tag mismatch or corrupted data');
  }
};

module.exports = {
  encrypt,
  decrypt,
};
