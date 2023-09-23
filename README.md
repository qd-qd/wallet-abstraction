# Wallet-Abstraction -- ETHGlobal NY 2023

Keywords: invisible wallet, ERC4337, instant frictionless onboarding, passkeys, smartphone secure enclave, secp256r1. 

## Description

This project is developped during the ETHGlobal NY Hackaton. Wallet abstraction enables instant single click onboarding of a user. With nothing but a smartphone using the power of account abstraction with passkeys. generate passkeys credentials, create its smart acount, mint a NFT, all in a single click ! The wallet is invisible.
![image](https://github.com/qd-qd/wallet-abstraction/assets/103030189/e1dffffb-f6ed-460f-8bbc-869476b2e979)

## What is demonstrated ?

A user take a picture of himself by clicking on the link, is asked to perform a biometric (touch/Face ID) authentication. The corresponding passkeys credentials are used as public key of the ERC4337, the picture is uploaded via IPFS, then the NFT is minted. All fee s are sponsored, the users doesn't see anything but a classic Web2 experience.

## How does it works ?

This project provides a completely frictionless onboarding of noob user in a single click. It combines the use of **our** OSS solidity [FCL](https://github.com/rdubois-crypto/FreshCryptoLib) library (secp256R1 best EVM implementation, presented at EthCC) to implement a FIDO/passkeys powered Userop. We combine it with Infinitism [ERC4337](https://github.com/rdubois-crypto/FreshCryptoLib) Entrypoint and a custom PayMaster to pay for the user fees, making it accessible to complete noob. 

## Intallation
