import { decode } from 'cbor';

/**
 * Convert response.attestationObject to a dev-friendly format
 */
export function decodeAttestationObject(base64urlString: string): AttestationObject {
  return decode(base64urlString, 'base64');
}

export type AttestationObject = {
  fmt: ATTESTATION_FORMATS;
  attStmt: AttestationStatement;
  authData: ArrayBuffer;
};

export type AttestationStatement = {
  sig?: Buffer;
  alg?: number;
  x5c?: Buffer[];
  response?: Buffer;
  ver?: string;
  certInfo?: Buffer;
  pubArea?: Buffer;
};

enum ATTESTATION_FORMATS {
  FIDO_U2F = 'fido-u2f',
  PACKED = 'packed',
  ANDROID_SAFETYNET = 'android-safetynet',
  ANDROID_KEY = 'android-key',
  TPM = 'tpm',
  NONE = 'none',
}
