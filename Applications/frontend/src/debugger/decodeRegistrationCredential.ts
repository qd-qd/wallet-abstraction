import { AuthenticatorAttestationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/typescript-types';
import { ClientDataJSON, decodeClientDataJSON } from './decodeClientDataJSON';
import { decodeAttestationObject } from './decodeAttestationObject';
import { AuthenticatorData, parseAuthData } from './parseAuthData';
import { ParsedAttestationStatement, parseAttestationStatement } from './parseAttestationStatement';

export function decodeRegistrationCredential(credential: RegistrationResponseJSON): Omit<
  RegistrationResponseJSON,
  'response'
> & {
  response: Omit<AuthenticatorAttestationResponseJSON, 'clientDataJSON' | 'attestationObject'> & {
    clientDataJSON: ClientDataJSON;
    attestationObject: {
      attStmt: ParsedAttestationStatement;
      authData: AuthenticatorData;
    };
  };
} {
  const { response } = credential;

  if (!response.clientDataJSON || !response.attestationObject) {
    throw new Error('The "clientDataJSON" and/or "attestationObject" properties are missing from "response"');
  }

  const clientDataJSON = decodeClientDataJSON(response.clientDataJSON);
  const attestationObject = decodeAttestationObject(response.attestationObject);

  const authData = parseAuthData(attestationObject.authData);
  const attStmt = parseAttestationStatement(attestationObject.attStmt);

  return {
    ...credential,
    response: {
      ...response,
      clientDataJSON,
      attestationObject: {
        ...attestationObject,
        attStmt,
        authData,
      },
    },
  };
}
