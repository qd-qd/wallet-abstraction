import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { decodeRegistrationCredential } from './debugger/decodeRegistrationCredential';
import { getAddress } from './walletTools';

type DecodedPasskey = ReturnType<typeof decodeRegistrationCredential>;

type PasskeyStore = {
  passkeyId: undefined | string;
  decodedPasskey: undefined | DecodedPasskey;
  passkeyCoordinates: undefined | [string, string];
  walletAddress: undefined | string;
  setPasskeyId: (passkeyId: string) => void;
  setDecodedPasskey: (decodedPasskey: DecodedPasskey) => void;
  setWalletAddress: (walletAddress: string) => void;
  setPasskeyCoordinates: (passkeyCoordinates: [string, string]) => void;
};

const usePasskeyStore = create<PasskeyStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      passkeyId: localStorage.getItem('passkeyId') || undefined,
      decodedPasskey: undefined,
      walletAddress: undefined,
      passkeyCoordinates: (() => {
        try {
          const parsedCrendentialsPublicKey: [string, string] = JSON.parse(localStorage.getItem('pkCoordinates')!);

          if (parsedCrendentialsPublicKey.length !== 2) {
            throw new Error();
          }

          return parsedCrendentialsPublicKey;
        } catch (e) {
          return;
        }
      })(),
      setPasskeyId: (passkeyId) => {
        localStorage.setItem('passkeyId', passkeyId);
        set(() => ({ passkeyId }));
      },
      setDecodedPasskey: (decodedPasskey) => {
        const { parsedCredentialPublicKey } = decodedPasskey.response.attestationObject.authData;
        localStorage.setItem(
          'pkCoordinates',
          JSON.stringify([parsedCredentialPublicKey?.x, parsedCredentialPublicKey?.y]),
        );
        set(() => ({ decodedPasskey }));
      },
      setWalletAddress: (walletAddress) => {
        set(() => ({ walletAddress }));
      },
      setPasskeyCoordinates: (passkeyCoordinates) => {
        set(() => ({ passkeyCoordinates }));
      },
    })),
  ),
);

const initState = usePasskeyStore.getState();
if (initState.passkeyId) {
  getAddress(initState.passkeyId).then((walletAddress: string) =>
    usePasskeyStore.setState({
      walletAddress,
    }),
  );
}
usePasskeyStore.subscribe(
  (state) => state.passkeyId,
  (passkeyId) => {
    if (passkeyId) {
      console.log('new passkey');
      getAddress(passkeyId).then((walletAddress) => usePasskeyStore.getState().setWalletAddress(walletAddress));
    }
  },
);

window.addEventListener('message', (event) => {
  switch (event.data?.type) {
    case 'sign:init': {
      const state = usePasskeyStore.getState();
      state.setWalletAddress(event.data?.data?.walletAddress);
      state.setPasskeyId(event.data?.data?.passkeyId);
      state.setPasskeyCoordinates(event.data?.data?.passkeyCoordinates);
      break;
    }
  }
});

export default usePasskeyStore;
