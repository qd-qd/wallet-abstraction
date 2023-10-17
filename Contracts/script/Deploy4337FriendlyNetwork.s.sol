// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { EntryPoint } from "@account-abstraction/contracts/core/EntryPoint.sol";
import { WebAuthn256r1 } from "../src/Lib/WebAuthn256r1.sol";
import { console2 } from "@forge-std/console2.sol";
import { Test } from "@forge-std/Test.sol";
import { WebAuthnAccountFactory } from "../src/Accounts/WebAuthnAccountFactory.sol";
import { Paymaster } from "../src/Paymaster/Paymaster.sol";
import { PolaroidNFT } from "../src/NFT/PolaroidNFT.sol";
import { BaseScript } from "./Base.s.sol";

/// @notice This script can be used to deploy all the contracts needed on
///         a network with an entrypoint contract
contract Deploy4337FriendlyNetwork is BaseScript, Test {
    address private immutable ENTRYPOINT_ADDRESS;
    address private constant BUNDLER = 0xE7d93AEE00757Da0bdb3eaB4D3E142D79B64DA9f;
    address private constant LOGIN_SERVICE_ADDRESS = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;

    constructor() {
        ENTRYPOINT_ADDRESS = vm.envOr("ENTRYPOINT", 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);
    }

    modifier checkEntryPointExistence() {
        uint32 size;
        address target = ENTRYPOINT_ADDRESS;

        assembly ("memory-safe") {
            size := extcodesize(target)
        }
        require(size > 0, "no entrypoint in this network");

        _;
    }

    function run() external broadcast checkEntryPointExistence returns (address[5] memory) {
        // get the entrypoint deployed on the network
        EntryPoint entrypoint = EntryPoint(payable(ENTRYPOINT_ADDRESS));
        console2.log("entrypoint", ENTRYPOINT_ADDRESS);

        // deploy the library to handle WebAuthm secp256r1 signature
        address webAuthnAddr = address(new WebAuthn256r1());
        console2.log("webAuthn", webAuthnAddr);

        // deploy the account factory
        WebAuthnAccountFactory webAuthnAccountFactory =
            new WebAuthnAccountFactory(entrypoint, webAuthnAddr, LOGIN_SERVICE_ADDRESS);
        console2.log("webAuthnAccountFactory", address(webAuthnAccountFactory));

        // Deploy the paymaster. The sender is set as the owner of the paymaster
        Paymaster paymaster = new Paymaster(entrypoint, msg.sender);
        console2.log("paymaster", address(paymaster));
        console2.log("paymaster owner", msg.sender);

        // Deploy the Polaroid NFT
        PolaroidNFT polaroidNFT = new PolaroidNFT();
        console2.log("POLAROID NFT", address(polaroidNFT));

        // Add stake and deposit to the paymaster
        paymaster.addStake{ value: 0.001 ether }(60 * 10);
        paymaster.deposit{ value: 0.002 ether }();
        console2.log("paymaster deposit", paymaster.getDeposit());

        // Feed the bundler
        payable(BUNDLER).transfer(0.01 ether);
        console2.log("bundler balance", BUNDLER.balance);

        // Return the addresses of the deployed contracts
        return [
            ENTRYPOINT_ADDRESS,
            webAuthnAddr,
            address(paymaster),
            address(webAuthnAccountFactory),
            address(polaroidNFT)
        ];
    }
}
