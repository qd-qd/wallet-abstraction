import { Certificate } from '@peculiar/asn1-x509';
import base64url from 'base64url';

import { AttestationStatement } from './decodeAttestationObject';
import { coseAlgToString } from './coseAlgToString';
import { x5cToStrings } from './x5cToStrings';
import { base64ToBase64URL } from './base64ToBase64URL';

/**
 * Break down attestation statement properties
 */
export function parseAttestationStatement(statement: AttestationStatement): ParsedAttestationStatement {
  const toReturn: ParsedAttestationStatement = {};

  // Packed, TPM, AndroidKey
  if (statement.alg) {
    toReturn.alg = coseAlgToString(statement.alg);
  }

  // Packed, TPM, AndroidKey, FIDO-U2F
  if (statement.sig) {
    toReturn.sig = base64ToBase64URL(Buffer.from(statement.sig).toString('base64'));
  }

  // Packed, TPM, AndroidKey, FIDO-U2F
  if (statement.x5c) {
    toReturn.x5c = x5cToStrings(statement.x5c);
  }

  // Android SafetyNet
  if (statement.response) {
    const jwt = statement.response.toString('utf8');
    const jwtParts = jwt.split('.');

    const header: SafetyNetJWTHeader = JSON.parse(base64url.decode(jwtParts[0]));
    const payload: SafetyNetJWTPayload = JSON.parse(base64url.decode(jwtParts[1]));
    const signature: SafetyNetJWTSignature = jwtParts[2];

    const certBuffers = header.x5c.map((cert: string) => Buffer.from(cert, 'base64'));
    const headerX5C = x5cToStrings(certBuffers);

    toReturn.response = {
      header: {
        ...header,
        x5c: headerX5C,
      },
      payload,
      signature,
    };
  }

  // TPM, Android SafetyNet
  if (statement.ver) {
    toReturn.ver = statement.ver;
  }

  // TPM
  if (statement.certInfo) {
    // TODO: Parse this TPM data structure
    toReturn.certInfo = base64ToBase64URL(Buffer.from(statement.certInfo).toString('base64'));
  }

  // TPM
  if (statement.pubArea) {
    // TODO: Parse this TPM data structure
    toReturn.pubArea = base64ToBase64URL(Buffer.from(statement.pubArea).toString('base64'));
  }

  return toReturn;
}

export type ParsedAttestationStatement = {
  alg?: string;
  sig?: string;
  ver?: string;
  x5c?: Certificate[];
  response?: {
    header: {
      alg: string;
      x5c: Certificate[];
    };
    payload: {
      nonce: string;
      timestampMs: number;
      apkPackageName: string;
      apkDigestSha256: string;
      ctsProfileMatch: boolean;
      apkCertificateDigestSha256: string[];
      basicIntegrity: boolean;
    };
    signature: string;
  };
  certInfo?: string;
  pubArea?: string;
};

type SafetyNetJWTHeader = {
  alg: string;
  x5c: string[];
};

type SafetyNetJWTPayload = {
  nonce: string;
  timestampMs: number;
  apkPackageName: string;
  apkDigestSha256: string;
  ctsProfileMatch: boolean;
  apkCertificateDigestSha256: string[];
  basicIntegrity: boolean;
};

type SafetyNetJWTSignature = string;
