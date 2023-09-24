import base64url from 'base64url';

/**
 * Convert response.clientDataJSON to a dev-friendly format
 */
export function decodeClientDataJSON(base64urlString: string): ClientDataJSON {
  return JSON.parse(base64url.decode(base64urlString));
}

export type ClientDataJSON = {
  type: string;
  challenge: string;
  origin: string;
  crossOrigin?: boolean;
  tokenBinding?: {
    id?: string;
    status: 'present' | 'supported' | 'not-supported';
  };
};
