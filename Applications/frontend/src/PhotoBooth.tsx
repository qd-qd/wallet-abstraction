import axios from 'axios';
import { useCallback, useRef, useState, memo, useMemo } from 'react';
import { ethers } from 'ethers';
import { IUserOperation, Presets, UserOperationBuilder } from 'userop';
import { simpleAccountAbi, entrypointContract, walletFactoryContract, nftPolaroidContract } from './contracts';
import CameraHolder, { CameraHandle } from './CameraHolder';
import ChatBubble, { ChatBubbleHandle } from './ChatBubble';
import homeImg from './assets/logo.svg';
import { provider } from './providers';
import {
  getAddress,
  getGasLimits,
  getPaymasterData,
  sendUserOp,
  signUserOp,
  signUserOpWithCreate,
  userOpToSolidity,
} from './walletTools';

enum STEPS {
  home,
  username,
  polaroid,
}

function PhotoBooth() {
  const webcamRef = useRef<CameraHandle | null>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const onWebcamReady = useCallback(() => {
    setWebcamReady(true);
  }, []);
  const chatBubbleRef = useRef<ChatBubbleHandle | null>(null);

  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  const uploadToIPFS = useCallback(async (blob: Blob | null): Promise<string> => {
    if (blob === null) throw new Error('no blob');

    const formDataImage = new FormData();
    formDataImage.append('file', blob);

    const { data: cidImage } = await axios.request({
      method: 'POST',
      url: 'https://demo.storj-ipfs.com/api/v0/add',
      data: formDataImage,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const metadata = {
      description: 'A selfie taken during ETHGlobal NYC 2023',
      image: 'ipfs://' + cidImage.Hash,
      name: 'ETHGlobal NYC 2023',
    };
    const formDataMetadata = new FormData();
    formDataMetadata.append('file', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

    const { data: cidMetadata } = await axios.request({
      method: 'POST',
      url: 'https://demo.storj-ipfs.com/api/v0/add',
      data: formDataMetadata,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return cidMetadata.Hash;
  }, []);

  const [login, setLogin] = useState(localStorage.getItem('login') || '');
  const [loginConfirmed, setLoginConfirmed] = useState(!!localStorage.getItem('login'));

  const [transactionHash, setTransactionHash] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<'waiting' | 'confirmed' | 'error'>();
  const sendTransaction = useCallback(
    async (blob: Blob | null | undefined) => {
      if (!login) throw Error('Login not set');
      if (!blob) throw new Error('no blob');

      setTransactionStatus('waiting');
      const hash = await uploadToIPFS(blob);
      console.log('yo hash', hash);
      console.log('yo login', login);

      const walletAddress = await getAddress(login);
      console.log('yo walletAddress', walletAddress);
      const userOpBuilder = new UserOperationBuilder()
        .useDefaults({
          sender: walletAddress,
        })
        .useMiddleware(Presets.Middleware.getGasPrice(provider))
        .setCallData(
          simpleAccountAbi.encodeFunctionData('execute', [
            nftPolaroidContract.address,
            0,
            nftPolaroidContract.interface.encodeFunctionData('mint', [Buffer.from(hash)]),
          ]),
        )
        .setNonce(await entrypointContract.getNonce(walletAddress, 0));

      const walletCode = await provider.getCode(walletAddress);
      console.log('yo walletCode', walletCode);
      const walletExists = walletCode !== '0x';
      console.log('yo walletExists', walletExists);
      console.log({ walletExists });

      if (!walletExists) {
        userOpBuilder.setInitCode(
          walletFactoryContract.address +
            walletFactoryContract.interface.encodeFunctionData('createAccount(string, uint256)', [login, 0]).slice(2),
        );
      }

      const { chainId } = await provider.getNetwork();
      const userOpToEstimateNoPaymaster = await userOpBuilder.buildOp(import.meta.env.VITE_ENTRYPOINT, chainId);
      const paymasterAndData = await getPaymasterData(userOpToEstimateNoPaymaster);
      const userOpToEstimate = {
        ...userOpToEstimateNoPaymaster,
        paymasterAndData,
      };
      console.log({ userOpToEstimate });
      console.log('estimated userop', userOpToSolidity(userOpToEstimate));

      const [gasLimits, baseUserOp] = await Promise.all([
        getGasLimits(userOpToEstimate),
        userOpBuilder.buildOp(import.meta.env.VITE_ENTRYPOINT, chainId),
      ]);
      console.log({
        gasLimits: Object.fromEntries(
          Object.entries(gasLimits).map(([key, value]) => [key, ethers.BigNumber.from(value).toString()]),
        ),
      });
      const userOp: IUserOperation = {
        ...baseUserOp,
        callGasLimit: gasLimits.callGasLimit,
        preVerificationGas: gasLimits.preVerificationGas,
        verificationGasLimit: gasLimits.verificationGasLimit,
        paymasterAndData,
      };

      console.log({ userOp });
      // console.log('to sign', userOpToSolidity(userOp));
      const userOpHash = await entrypointContract.getUserOpHash(userOp);
      console.log('TO SIGN', { userOpHash });
      const loginPasskeyId = localStorage.getItem(`${login}_passkeyId`);
      const signature = loginPasskeyId
        ? await signUserOp(userOpHash, loginPasskeyId)
        : await signUserOpWithCreate(userOpHash, login);

      if (!signature) throw new Error('Signature failed');
      const signedUserOp: IUserOperation = {
        ...userOp,
        // paymasterAndData: await getPaymasterData(userOp),
        signature,
      };
      console.log({ signedUserOp });
      console.log('signed', userOpToSolidity(signedUserOp));

      sendUserOp(signedUserOp)
        .then(async (receipt) => {
          await receipt.wait();
          setTransactionHash(receipt.hash);
          setTransactionStatus('confirmed');
          console.log({ receipt });
          const events = await nftPolaroidContract.queryFilter(
            nftPolaroidContract.filters.Transfer(ethers.constants.AddressZero, walletAddress),
            receipt.blockNumber,
          );
          console.log({ events });
          await webcamRef.current?.reveal();
          const tokenUri = await nftPolaroidContract.tokenURI(events[0].args?.tokenId);
          console.log(`https://demo.storj-ipfs.com/ipfs/${tokenUri.replace('ipfs://', '')}`, tokenUri);
          const { data: metadata } = await axios.get(
            `https://demo.storj-ipfs.com/ipfs/${tokenUri.replace('ipfs://', '')}`,
          );
          console.log(metadata);
          chatBubbleRef.current?.show();
        })
        .catch((e) => {
          setTransactionStatus('error');
          console.error(e);
        });
    },
    [login, imageBlob],
  );

  const [cameraRequested, setCameraRequested] = useState(false);
  const onActivateCamera = useCallback(() => {
    setCameraRequested(true);
  }, []);
  const onScreenshot = useCallback(async () => {
    if (!cameraRequested) throw new Error('Camera is not set');

    const { blob } = (await webcamRef.current?.takeScreenshot()) || {};
    setImageBlob(blob || null);
    console.log('yo in');
    sendTransaction(blob);
  }, [imageBlob, login, cameraRequested]);

  const step = useMemo(() => {
    if (!cameraRequested) {
      return STEPS.home;
    }
    if (cameraRequested && !loginConfirmed) {
      return STEPS.username;
    }
    if (cameraRequested && loginConfirmed) {
      return STEPS.polaroid;
    }
  }, [cameraRequested, loginConfirmed]);

  return (
    <div className="flex flex-col w-10/12 lg:w-2/6 self-center items-center justify-center h-full">
      {step === STEPS.home && (
        <>
          <img className="w-full mb-12" src={homeImg} alt="" />
          <button className="btn btn-primary w-3/4 break-words" onClick={onActivateCamera}>
            Take a forever selfie!
          </button>
        </>
      )}
      {step === STEPS.username && (
        <div className="form-control w-full max-w-xs items-center">
          <label className="label self-start">
            <span className="label-text text-lg">Choose an username</span>
          </label>
          <input
            type="text"
            placeholder="qdqd"
            className="input input-bordered glass w-full max-w-xs"
            value={login}
            onChange={(e) => {
              setLogin(e.target.value.toLocaleLowerCase());
            }}
          />
          <button
            className="btn btn-neutral w-1/2 mt-10"
            onClick={() => {
              setLoginConfirmed(true);
              localStorage.setItem('login', login);
            }}
            disabled={login.length < 3}
          >
            {login.length < 3 ? `Nope` : "I'm good"}
          </button>
        </div>
      )}
      {step === STEPS.polaroid && (
        <div className="flex flex-col w-full h-full justify-center items-center">
          <div className="w-10/12 md:w-9/12 lg:full relative">
            <CameraHolder ref={webcamRef} cameraRequested={cameraRequested} onReady={onWebcamReady} />
          </div>
          <div className="pt-10 w-9/12 flex align-center justify-between gap-2 flex-wrap">
            {!imageBlob && (
              <button className="btn btn-secondary flex-grow" onClick={onScreenshot} disabled={!webcamReady}>
                {webcamReady ? 'Take a selfie !' : <span className="loading loading-dots"></span>}
              </button>
            )}
            {imageBlob && transactionStatus === 'waiting' && (
              <button className="btn btn-secondary flex-grow" disabled>
                <span className="loading loading-dots"></span>
              </button>
            )}
          </div>
        </div>
      )}

      <ChatBubble ref={chatBubbleRef} transactionHash={transactionHash} />
    </div>
  );
}

export default memo(PhotoBooth);
