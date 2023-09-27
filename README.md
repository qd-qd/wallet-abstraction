# Wallet-Abstraction -- ETHGlobal NY 2023

![image](https://github.com/qd-qd/wallet-abstraction/assets/103030189/110fca35-e41c-484c-b216-444d8d68fcec)

## Table of Contents

1. [Description](#description)
2. [What is demonstrated?](#what-is-demonstrated-)
3. [How does it work?](#how-does-it-works-)
4. [Why is it simple, efficient and secure?](#why-is-it-simple-efficient-and-secure-)
5. [Installation](#intallation)
   - [Contracts](#contracts)
     - [Deploy the entire stack on Anvil](#deploy-the-entiere-stack-on-anvil)
     - [Deploy the stack on networks that already have an EntryPoint contract](#deploy-the-stack-on-networks-that-already-have-an-entrypoint-contract)
   - [Applications](#applications)
6. [Live contracts addresses](#live-contracts-addresses)
   - [Sepolia](#sepolia)
   - [Polygon Mumbai PoS](#polygon-mumbai-pos)
   - [Polygon zkEVM Testnet](#polygon-zkevm-testnet)
   - [Linea](#linea)
   - [Stylus](#stylus)
   - [Scroll](#scroll)
   - [CELO](#celo)
   - [Mantle](#mantle)
7. [Code ownership](#code-ownership)

Keywords: invisible wallet, ERC4337, instant frictionless onboarding, passkeys, smartphone secure enclave, secp256r1.

## Description

This project was developed as part of the ETHGlobal NY Hackathon. Wallet Abstraction offers seamless, one-click user onboarding using only a smartphone or a laptop, thanks to the advanced features of account abstraction with passkeys. Users can generate passkey credentials, set up their smart accounts, and even mint an NFT—all with a single click! The wallet remains completely invisible to the user.

![image](https://github.com/qd-qd/wallet-abstraction/assets/103030189/e1dffffb-f6ed-460f-8bbc-869476b2e979)

## What is demonstrated ?

A user take a picture of himself by clicking on the link, is asked to perform a biometric (touch/Face ID) authentication. The corresponding passkeys credentials are used as public key of the ERC4337, the picture is uploaded via IPFS, then the NFT is minted. All the fees are sponsored, the users doesn't see anything but a classic Web2 experience. An 4337-compliant account is automatically deployed for each useer.

## How does it works ?

This project provides the best optimal **UX OPTIMIZATION** with a completely frictionless onboarding of a new user in a single click. It combines the use of **our** OSS solidity [FCL](https://github.com/rdubois-crypto/FreshCryptoLib) library (secp256R1 best EVM implementation, presented at EthCC) to implement a FIDO/passkeys powered Userop. We combine it with Infinitism [ERC4337](https://github.com/rdubois-crypto/FreshCryptoLib) Entrypoint and a custom PayMaster to pay for the user fees, making it accessible to complete who do not know anything about crypto'. The implementation of the [WebAuthnAccount.sol](https://github.com/qd-qd/wallet-abstraction/blob/86ac70f17189caf8e72e5c7817b52cda00438340/Contracts/src/Accounts/WebAuthnAccount.sol) realizes this combination.

## Why is it simple, efficient and secure ?

Passkeys is a current revolution of Web2 security. It will replace passwords management and the risks associated to it by robust ECC authentication as is an EoA. This revolution happens with the ERC-4337, and their combination will revolutionize accessibility and inclusivity to web3. With passkeys, the private key is stored in the secure enclave, which is hardened to withstand advanced attacks. As opposed to keys stored in the browser, they are stored securely.
It also prevents from fishing, as passkeys are related to a website (the site of the dApp). The solidity verification uses FCL, implementing EVM dedicated formulas. For the hackaton sake, the version without precomputations is used. The most efficient verification function runs in 69K gas. See https://eprint.iacr.org/2023/939 for cryptographical details. 

## Intallation

### Contracts

Once in the `Contracts` folder, set your environement variables and then:

#### Deploy the entiere stack on Anvil

```bash
forge script script/DeployAllAnvil.s.sol --private-key <PRIVATE_KEY> --broadcast -vvv --rpc-url http://localhost:8545
```

#### Deploy the stack on networks that already have an EntryPoint contract

```bash
forge script script/Deploy4337FriendlyNetwork.s.sol --private-key <PRIVATE_KEY> --broadcast -vvv --rpc-url <RPC_URL>
```

### Applications

In the `Applications` folder, use the `.env.dist` as an example for your `.env` and then:

```bash
docker-compose up -d
```

If you're using anvil as RPC, you'll have to add in your `etc/hosts`:

```
127.0.0.1 host.docker.internal
```

then set the `RPC` environement variable of your `.env` to `http://host.docker.internal:8545` and `BUNDLER_UNSAFE` to `true`.

The paymaster's `owner` is initially set to the contract deployer by default. Therefore, please remember to either assign the same address to the `PAYMASTER_PK` variable as the one used for deployment or use the `transferOwnership` function into the deployment script used.

## Live contracts addresses

Here is the listing of the deployed contracts on the different networks.

It can be checked that bytecodes are identical. Only Sepolia are verified.
When we could we deployed at the same address the contracts with nonce starting at 0. Some network specificities or failures might shift the nonce.

- WebAuthn: 0xeec23d5e9b75e12984228c8e2c9ae578744368e2
- Wallet Factory: 0xd5534f16ebd32dcfc6282d1e66a32d1d0abfe569
- Paymaster: 0xda470171feb4fd852433a7a7f67e3a3918a7a154
- NFT Polaroid: 0xa848a42175f941ff7ebf8daab6b70cad60be2062

### Sepolia:

https://sepolia.etherscan.io/address/0xbbc76f5b09462e397fba811e1aaa738874bcd839 (verified)
https://sepolia.etherscan.io/address/0x019c256074d423a7dc157d9d9a72d16bcf47d301
https://sepolia.etherscan.io/address/0xa85db95b58bad349e8b6fe00340aeb53d0c9566f
https://sepolia.etherscan.io/address/0x97d6f9fe747377a6164426b89d3c32fe87da8dde

### Polygon Mumbai PoS:

- WebAuthn: https://mumbai.polygonscan.com/address/0xeec23d5e9b75e12984228c8e2c9ae578744368e2
- Wallet Factory: https://mumbai.polygonscan.com/address/0xd5534f16ebd32dcfc6282d1e66a32d1d0abfe569
- Paymaster: https://mumbai.polygonscan.com/address/0xda470171feb4fd852433a7a7f67e3a3918a7a154
- NFT Polaroid: https://mumbai.polygonscan.com/address/0xa848a42175f941ff7ebf8daab6b70cad60be2062

### Polygon zkEVM Testnet:

- WebAuthn: https://testnet-zkevm.polygonscan.com/address/0xeec23d5e9b75e12984228c8e2c9ae578744368e2
- Wallet Factory: https://testnet-zkevm.polygonscan.com/address/0xd5534f16ebd32dcfc6282d1e66a32d1d0abfe569
- Paymaster: https://testnet-zkevm.polygonscan.com/address/0xda470171feb4fd852433a7a7f67e3a3918a7a154
- NFT Polaroid: https://testnet-zkevm.polygonscan.com/address/0xa848a42175f941ff7ebf8daab6b70cad60be2062

### Linea

(canonical addresses)

0xEeC23D5e9B75E12984228c8E2C9AE578744368e2
https://explorer.goerli.linea.build/address/0xd5534f16EBD32DCFC6282D1e66A32d1d0abfE569
https://explorer.goerli.linea.build/address/0xdA470171FeB4fd852433a7A7f67e3A3918a7A154
https://explorer.goerli.linea.build/address/0xa848A42175f941FF7EbF8DaAB6b70cad60Be2062

### Stylus

Nota: It was necessary to deploy an `EntryPoint` on the network, thus the nonce was shifted as the network didn't supported the EIP-4337.

https://stylus-testnet-explorer.arbitrum.io/address/0xa848A42175f941FF7EbF8DaAB6b70cad60Be2062
https://stylus-testnet-explorer.arbitrum.io/address/0xdA470171FeB4fd852433a7A7f67e3A3918a7A154
https://stylus-testnet-explorer.arbitrum.io/address/0xd5534f16EBD32DCFC6282D1e66A32d1d0abfE569
https://stylus-testnet-explorer.arbitrum.io/address/0x29147591F22Df4A47cb165fcc3aa289470F02cF4
https://stylus-testnet-explorer.arbitrum.io/address/0x187488B375eb65a2254e4e36Cc7098138073ED5f

### Scroll

(canonical addresses)
https://sepolia-blockscout.scroll.io/address/0xa848A42175f941FF7EbF8DaAB6b70cad60Be2062

### CELO

(canonical addresses)
https://explorer.celo.org/alfajores/address/0xA099BA0dAe1f54f1Fd7238bd9d6885Af2427A28C/transactions#address-tabs

### Mantle

(2 extra transactions due to network congestion)
https://testnet.mantlescan.org/address/0xa099ba0dae1f54f1fd7238bd9d6885af2427a28c

## Code ownership

- This file `Contracts/src/Lib/secp256r1.sol` has been taken from the implementation of @rdubois-crypto in the FCL library (https://github.com/rdubois-crypto/FreshCryptoLib)
- This file `Contracts/src/Lib/WebAuthn256r1.sol` is highly inspired by the work of @btchip. It has been adapted and improved.
- The bundler used in this project (here:`Applications/bundler`) has been developed by @drortirosh. It has been updated for our specific needs

Everything else has been developed by our team.
