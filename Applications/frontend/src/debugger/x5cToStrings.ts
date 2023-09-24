import { AsnParser } from '@peculiar/asn1-schema';
import { Certificate } from '@peculiar/asn1-x509';

/**
 * Parse X.509 certificates into something legible
 */
export function x5cToStrings(x5c: Buffer[]): Certificate[] {
  return x5c.map((cert) => AsnParser.parse(Buffer.from(cert), Certificate));
}
