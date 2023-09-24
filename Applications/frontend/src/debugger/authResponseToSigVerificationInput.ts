import { ethers } from 'ethers';
import base64url from 'base64url';
import { ECDSASigValue } from '@peculiar/asn1-ecc';
import { AsnParser } from '@peculiar/asn1-schema';
import { AuthenticatorAssertionResponseJSON } from '@simplewebauthn/typescript-types';

function shouldRemoveLeadingZero(bytes: Uint8Array): boolean {
  return bytes[0] === 0x0 && (bytes[1] & (1 << 7)) !== 0;
}

/**
 * Parse the WebAuthn data payload and to create the inputs to verify the secp256r1/p256 signatures
 * in the EllipticCurve.sol contract, see https://github.com/tdrerup/elliptic-curve-solidity
 */
export const authResponseToSigVerificationInput = (
  // Assumes the public key is on the secp256r1/p256 curve
  parsedCredentialPublicKey: { x?: string; y?: string } | undefined,
  authResponse: AuthenticatorAssertionResponseJSON,
) => {
  const authDataBuffer = base64url.toBuffer(authResponse.authenticatorData);
  const clientDataHash = Buffer.from(
    ethers.utils.sha256(base64url.toBuffer(authResponse.clientDataJSON)).slice(2),
    'hex',
  );

  const signatureBase = Buffer.concat([authDataBuffer, clientDataHash]);

  // See https://github.dev/MasterKale/SimpleWebAuthn/blob/master/packages/server/src/helpers/iso/isoCrypto/verifyEC2.ts
  // for extraction of the r and s bytes from the raw signature buffer
  const parsedSignature = AsnParser.parse(base64url.toBuffer(authResponse.signature), ECDSASigValue);
  let rBytes = new Uint8Array(parsedSignature.r);
  let sBytes = new Uint8Array(parsedSignature.s);

  if (shouldRemoveLeadingZero(rBytes)) {
    rBytes = rBytes.slice(1);
  }

  if (shouldRemoveLeadingZero(sBytes)) {
    sBytes = sBytes.slice(1);
  }

  // Message data in sha256 hash
  const messageHash = ethers.utils.sha256(signatureBase);
  // r and s values
  const signature = ['0x' + Buffer.from(rBytes).toString('hex'), '0x' + Buffer.from(sBytes).toString('hex')];
  // x and y coordinates
  const publicKeyCoordinates = [
    '0x' + base64url.toBuffer(parsedCredentialPublicKey?.x || '').toString('hex'),
    '0x' + base64url.toBuffer(parsedCredentialPublicKey?.y || '').toString('hex'),
  ];

  // Pass the following data to the EllipticCurve.validateSignature smart contract function
  return {
    messageHash,
    signature,
    publicKeyCoordinates,
  };
};
