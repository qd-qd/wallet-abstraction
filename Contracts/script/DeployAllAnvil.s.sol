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

contract DeployAnvil is BaseScript, Test {
    function run() external broadcast returns (address[5] memory) {
        // deploy the library contract and return the address
        EntryPoint entryPoint = new EntryPoint();
        console2.log("entrypoint", address(entryPoint));

        address webAuthnAddr = address(new WebAuthn256r1());
        console2.log("webAuthn", webAuthnAddr);
        WebAuthnAccountFactory webAuthnAccountFactory =
            new WebAuthnAccountFactory(entryPoint, webAuthnAddr, 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);

        console2.log("webAuthnAccountFactory", address(webAuthnAccountFactory));

        Paymaster paymaster = new Paymaster(entryPoint, msg.sender);
        console2.log("paymaster", address(paymaster));
        console2.log("paymaster owner", msg.sender);

        PolaroidNFT polaroidNFT = new PolaroidNFT();
        console2.log("POLAROID NFT", address(polaroidNFT));

        paymaster.addStake{ value: 5 ether }(60 * 10);
        paymaster.deposit{ value: 10 ether }();
        console2.log("paymaster deposit", paymaster.getDeposit());

        return [
            address(entryPoint),
            webAuthnAddr,
            address(paymaster),
            address(webAuthnAccountFactory),
            address(polaroidNFT)
        ];
    }
}
