// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {RivertingEscrow} from "../src/RivertingEscrow.sol";

contract DeployScript is Script {
    function run() external {
        address platformWallet = vm.envOr("PLATFORM_WALLET", address(0x1234567890123456789012345678901234567890));
        uint96 platformFeeRate = uint96(vm.envOr("PLATFORM_FEE_RATE", uint256(300)));
        address paymentToken = vm.envOr("USDC_ADDRESS", address(0x74b7F16337b8972027F6196A17a631aC6dE26d22));
        address platformOperator = vm.envOr("PLATFORM_OPERATOR", platformWallet);

        vm.startBroadcast();
        RivertingEscrow escrow = new RivertingEscrow(
            platformWallet,
            platformOperator,
            platformFeeRate,
            paymentToken
        );
        vm.stopBroadcast();

        console.log("RivertingEscrow deployed at:", address(escrow));
        console.log("Platform wallet:", platformWallet);
        console.log("Platform fee rate:", platformFeeRate);
        console.log("Payment token:", paymentToken);
    }
}
