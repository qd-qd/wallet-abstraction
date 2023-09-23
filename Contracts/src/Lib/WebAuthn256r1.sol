pragma solidity >=0.8.19 <0.9.0;

import { FCL_Elliptic_ZZ } from "./secp256r1.sol";
import { Base64 } from "@solady/utils/Base64.sol";

/// @title WebAuthn256r1
/// @custom:experimental This is an experimental contract.
contract WebAuthn256r1 {
    error InvalidAuthenticatorData();
    error InvalidClientData();
    error InvalidChallenge();

    function generateMessage(
        bytes1 authenticatorDataFlagMask,
        bytes calldata authenticatorData,
        bytes calldata clientData,
        bytes calldata clientChallenge,
        uint256 clientChallengeOffset
    )
        internal
        pure
        returns (bytes32 message)
    {
        unchecked {
            if ((authenticatorData[32] & authenticatorDataFlagMask) == 0) revert InvalidAuthenticatorData();
            if (clientChallenge.length == 0) revert InvalidChallenge();
            bytes memory challengeEncoded = bytes(Base64.encode(clientChallenge, true, true));
            bytes32 challengeHashed =
                keccak256(clientData[clientChallengeOffset:(clientChallengeOffset + challengeEncoded.length)]);
            if (keccak256(challengeEncoded) != challengeHashed) revert InvalidClientData();
            message = sha256(abi.encodePacked(authenticatorData, sha256(clientData)));
        }
    }

    function verify(
        bytes1 authenticatorDataFlagMask,
        bytes calldata authenticatorData,
        bytes calldata clientData,
        bytes calldata clientChallenge,
        uint256 clientChallengeOffset,
        uint256[2] calldata rs,
        uint256[2] calldata Q
    )
        external
        returns (bool)
    {
        unchecked {
            bytes32 message = generateMessage(
                authenticatorDataFlagMask, authenticatorData, clientData, clientChallenge, clientChallengeOffset
            );
            return FCL_Elliptic_ZZ.ecdsa_verify(message, rs, Q);
        }
    }
}
