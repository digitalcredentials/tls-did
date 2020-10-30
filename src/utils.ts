import { createSign } from 'crypto';

export function sign(pemPrivateKey: string, data: string): string {
  const signer = createSign('sha256');
  signer.update(data);
  signer.end();
  const signature = signer.sign(pemPrivateKey).toString('base64');
  return signature;
}
