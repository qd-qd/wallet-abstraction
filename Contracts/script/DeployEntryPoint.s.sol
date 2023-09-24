// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { EntryPoint } from "@account-abstraction/contracts/core/EntryPoint.sol";
import { console2 } from "@forge-std/console2.sol";
import { Test } from "@forge-std/Test.sol";
import { BaseScript } from "./Base.s.sol";

contract DeployEntrypoint is BaseScript, Test {
    function run() external broadcast returns (address) {
        // deploy the entrypoint contract required by the 4337
        EntryPoint entryPoint = new EntryPoint();
        console2.log("entrypoint", address(entryPoint));

        return address(entryPoint);
    }
}
