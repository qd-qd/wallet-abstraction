// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import { console2 } from "@forge-std/console2.sol";

struct GasLessUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
}

library GasLessUserOperationLib {
    function getSender(GasLessUserOperation memory userOp) internal pure returns (address) {
        address data;
        //read sender from userOp, which is first userOp member (saves 800 gas...)
        assembly {
            data := calldataload(userOp)
        }
        return address(uint160(data));
    }

    function pack(GasLessUserOperation memory userOp) internal pure returns (bytes memory packed) {
        address sender = userOp.sender;
        uint256 nonce = userOp.nonce;
        bytes32 hashInitCode = keccak256(userOp.initCode);
        bytes32 hashCallData = keccak256(userOp.callData);
        uint256 maxFeePerGas = userOp.maxFeePerGas;
        uint256 maxPriorityFeePerGas = userOp.maxPriorityFeePerGas;
        console2.log("-------------------------------------------");
        console2.log("sender", sender);
        console2.log("nonce", nonce);
        console2.log("hashInitCode");
        console2.logBytes32(hashInitCode);
        console2.log("hashCallData");
        console2.logBytes32(hashCallData);
        console2.log("maxFeePerGas", maxFeePerGas);
        console2.log("maxPriorityFeePerGas", maxPriorityFeePerGas);
        console2.log("-------------------------------------------");
        console2.log("packed");

        packed = abi.encode(sender, nonce, hashInitCode, hashCallData, maxFeePerGas, maxPriorityFeePerGas);
        console2.logBytes(packed);
    }

    function hash(GasLessUserOperation memory userOp) internal pure returns (bytes32) {
        return keccak256(pack(userOp));
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
