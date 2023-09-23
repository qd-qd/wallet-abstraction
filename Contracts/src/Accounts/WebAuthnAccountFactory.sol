// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import { Create2 } from "@openzeppelin/contracts/utils/Create2.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { IEntryPoint } from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { WebAuthnAccount } from "./WebAuthnAccount.sol";

/**
 * A sample factory contract for WebAuthnAccount
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample
 * factory).
 * The factory's createAccount returns the target account address even if it is already installed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract WebAuthnAccountFactory {
    WebAuthnAccount public immutable accountImplementation;

    constructor(IEntryPoint _entryPoint, address webAuthnVerifier, address loginService) {
        accountImplementation = new WebAuthnAccount(_entryPoint, webAuthnVerifier, loginService, address(this));
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after
     * account creation
     */
    function createAccount(
        string calldata login,
        bytes calldata credId,
        uint256[2] calldata pubKeyCoordinates,
        uint256 salt
    )
        public
        returns (WebAuthnAccount)
    {
        address addr = getAddress(login, salt);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return WebAuthnAccount(payable(addr));
        }
        WebAuthnAccount acc = WebAuthnAccount(
            payable(
                new ERC1967Proxy{salt : bytes32(salt)}(
                address(accountImplementation),
                abi.encodeCall(WebAuthnAccount.initialize, (login))
                )
            )
        );
        acc.addFirstSigner(credId, pubKeyCoordinates);

        return acc;
    }

    function createAccount(string calldata login, uint256 salt) public returns (WebAuthnAccount) {
        address addr = getAddress(login, salt);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return WebAuthnAccount(payable(addr));
        }
        WebAuthnAccount acc = WebAuthnAccount(
            payable(
                new ERC1967Proxy{salt : bytes32(salt)}(
                address(accountImplementation),
                abi.encodeCall(WebAuthnAccount.initialize, (login))
                )
            )
        );

        return acc;
    }

    /**
     * calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function getAddress(string calldata login, uint256 salt) public view returns (address) {
        return Create2.computeAddress(
            bytes32(salt),
            keccak256(
                abi.encodePacked(
                    type(ERC1967Proxy).creationCode,
                    abi.encode(address(accountImplementation), abi.encodeCall(WebAuthnAccount.initialize, (login)))
                )
            )
        );
    }
}
