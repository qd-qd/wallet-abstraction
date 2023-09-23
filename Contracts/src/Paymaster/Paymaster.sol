// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { BasePaymaster } from "@account-abstraction/contracts/core/BasePaymaster.sol";
import { _packValidationData } from "@account-abstraction/contracts/core/Helpers.sol";
import { IEntryPoint } from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { UserOperation } from "@account-abstraction/contracts/interfaces/UserOperation.sol";
import { GasLessUserOperation, GasLessUserOperationLib } from "./GasLessUserOperation.sol";
import { console2 } from "@forge-std/console2.sol";

contract Paymaster is BasePaymaster {
    using GasLessUserOperationLib for GasLessUserOperation;
    using ECDSA for bytes32;

    struct PaymasterAndData {
        address paymasterAddress;
        bytes GasLessUserOperationHash;
        uint48 validAfter;
        uint48 validUntil;
        uint256 chainId;
        bytes signature;
    }

    event UserOperationSponsored(address indexed sender, uint256 actualGasCost);

    constructor(IEntryPoint _entryPoint, address _owner) BasePaymaster(_entryPoint) {
        _transferOwnership(_owner);
    }

    function parsePaymasterAndData(bytes calldata paymasterAndData) internal pure returns (PaymasterAndData memory) {
        address paymasterAddress = address(bytes20(paymasterAndData[:20]));
        (
            bytes memory GasLessUserOperationHash,
            uint48 validAfter,
            uint48 validUntil,
            uint256 chainId,
            bytes memory signature
        ) = abi.decode(paymasterAndData[20:], (bytes, uint48, uint48, uint256, bytes));

        return PaymasterAndData(paymasterAddress, GasLessUserOperationHash, validAfter, validUntil, chainId, signature);
    }

    /**
     * Verify our external signer signed this request and decode paymasterData
     * paymasterData contains the following:
     * token address length 20
     * signature length 64 or 65
     */
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 requiredPreFund
    )
        internal
        virtual
        override
        returns (bytes memory context, uint256 validationData)
    {
        PaymasterAndData memory paymasterAndData = parsePaymasterAndData(userOp.paymasterAndData);
        require(paymasterAndData.chainId == block.chainid, "incorrect chainId");
        require(
            paymasterAndData.signature.length == 64 || paymasterAndData.signature.length == 65,
            "CP01: invalid signature length in paymasterAndData"
        );

        GasLessUserOperation memory verifiableUserOp = GasLessUserOperation({
            sender: userOp.sender,
            nonce: userOp.nonce,
            initCode: userOp.initCode,
            callData: userOp.callData,
            maxFeePerGas: userOp.maxFeePerGas,
            maxPriorityFeePerGas: userOp.maxPriorityFeePerGas
        });
        bytes32 GasLessUserOperationHash = verifiableUserOp.hash();
        console2.log("gassLessUserOp hash");
        console2.logBytes32(GasLessUserOperationHash);
        address recoveredAddress = GasLessUserOperationHash.toEthSignedMessageHash().recover(paymasterAndData.signature);
        if (owner() != recoveredAddress) {
            console2.log("gassLessUserOp recoveredAddress", recoveredAddress);
            console2.log("owner", owner());
            return ("", _packValidationData(true, uint48(block.timestamp), uint48(block.timestamp)));
        }

        bytes memory _context = abi.encode(userOp, paymasterAndData);
        return (_context, _packValidationData(false, paymasterAndData.validUntil, paymasterAndData.validAfter));
    }

    /**
     * Perform the post-operation to charge the sender for the gas.
     */
    function _postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) internal override {
        if (mode != PostOpMode.postOpReverted) {
            (UserOperation memory userOp, PaymasterAndData memory paymasterAndData) =
                abi.decode(context, (UserOperation, PaymasterAndData));
            emit UserOperationSponsored(userOp.sender, actualGasCost);
        }
    }
}
