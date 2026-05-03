import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY!
  if (!key || key.length < KEY_LENGTH) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  return Buffer.from(key.slice(0, KEY_LENGTH), 'utf8')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(encryptedText: string): string {
  const key = getKey()
  const parts = encryptedText.split(':')
  if (parts.length !== 2) throw new Error('Invalid encrypted text format')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = Buffer.from(parts[1], 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}
