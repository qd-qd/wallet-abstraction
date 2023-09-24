import { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';
import { ClientDataJSON, decodeClientDataJSON } from './decodeClientDataJSON';
import { AuthenticatorData, parseAuthData } from './parseAuthData';

export function decodeAuthenticationCredential(credential: AuthenticationResponseJSON): Omit<
  AuthenticationResponseJSON,
  'response'
> & {
  response: {
    authenticatorData: AuthenticatorData;
    clientDataJSON: ClientDataJSON;
  };
} {
  const { response } = credential;

  if (!response.clientDataJSON || !response.authenticatorData || !response.signature) {
    throw new Error(
      'The "clientDataJSON", "attestationObject", and/or "signature" properties are missing from "response"',
    );
  }

  const clientDataJSON = decodeClientDataJSON(response.clientDataJSON);
  const authenticatorData = parseAuthData(Buffer.from(response.authenticatorData, 'base64'));

  return {
    ...credential,
    response: {
      ...credential.response,
      authenticatorData,
      clientDataJSON,
    },
  };
}
