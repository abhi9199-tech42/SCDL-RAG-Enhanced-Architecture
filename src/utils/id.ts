import * as crypto from 'crypto';

let counter = 0;

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  const seq = (counter++).toString(36);
  return prefix ? `${prefix}_${timestamp}_${random}_${seq}` : `${timestamp}_${random}_${seq}`;
}

export function generateDeterministicId(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}
