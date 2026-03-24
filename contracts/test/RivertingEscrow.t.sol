// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {RivertingEscrow} from "../src/RivertingEscrow.sol";

contract RivertingEscrowTest is Test {
    RivertingEscrow internal escrow;

    address internal constant PLATFORM = address(0xA11CE);
    address internal constant PAYMENT_TOKEN = address(0xBEEF);
    uint96 internal constant PLATFORM_FEE_RATE = 250;

    address internal curator = address(0xCAFE);
    address internal other = address(0xD00D);

    event AgentRegistered(uint256 indexed agentId, address indexed curator, uint96 curatorRate, string metadataURI);
    event AgentUpdated(uint256 indexed agentId, uint96 curatorRate, string metadataURI);
    event AgentDeactivated(uint256 indexed agentId);

    function setUp() public {
        escrow = new RivertingEscrow(PLATFORM, PLATFORM_FEE_RATE, PAYMENT_TOKEN);
    }

    function testRegisterAgent() public {
        vm.prank(curator);
        vm.expectEmit(true, true, false, true);
        emit AgentRegistered(0, curator, 1_000, "ipfs://agent-1");
        uint256 agentId = escrow.registerAgent(1_000, "ipfs://agent-1");

        assertEq(agentId, 0);

        RivertingEscrow.Agent memory agent = escrow.getAgent(agentId);
        assertEq(agent.curator, curator);
        assertEq(agent.curatorRatePerSecond, 1_000);
        assertEq(agent.metadataURI, "ipfs://agent-1");
        assertTrue(agent.active);
    }

    function testRegisterMultipleAgents() public {
        vm.prank(curator);
        uint256 id0 = escrow.registerAgent(100, "ipfs://a");

        vm.prank(other);
        uint256 id1 = escrow.registerAgent(200, "ipfs://b");

        vm.prank(address(0xEEE));
        uint256 id2 = escrow.registerAgent(300, "ipfs://c");

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(escrow.nextAgentId(), 3);
    }

    function testUpdateAgent() public {
        vm.prank(curator);
        uint256 agentId = escrow.registerAgent(1_000, "ipfs://old");

        vm.prank(curator);
        vm.expectEmit(true, false, false, true);
        emit AgentUpdated(agentId, 2_500, "ipfs://new");
        escrow.updateAgent(agentId, 2_500, "ipfs://new");

        RivertingEscrow.Agent memory agent = escrow.getAgent(agentId);
        assertEq(agent.curatorRatePerSecond, 2_500);
        assertEq(agent.metadataURI, "ipfs://new");
        assertTrue(agent.active);
    }

    function testUpdateAgentByNonCurator() public {
        vm.prank(curator);
        uint256 agentId = escrow.registerAgent(1_000, "ipfs://old");

        vm.prank(other);
        vm.expectRevert(RivertingEscrow.NotAgentCurator.selector);
        escrow.updateAgent(agentId, 2_500, "ipfs://new");
    }

    function testDeactivateAgent() public {
        vm.prank(curator);
        uint256 agentId = escrow.registerAgent(1_000, "ipfs://old");

        vm.prank(curator);
        vm.expectEmit(true, false, false, false);
        emit AgentDeactivated(agentId);
        escrow.deactivateAgent(agentId);

        RivertingEscrow.Agent memory agent = escrow.getAgent(agentId);
        assertFalse(agent.active);
    }

    function testDeactivateByNonCurator() public {
        vm.prank(curator);
        uint256 agentId = escrow.registerAgent(1_000, "ipfs://old");

        vm.prank(other);
        vm.expectRevert(RivertingEscrow.NotAgentCurator.selector);
        escrow.deactivateAgent(agentId);
    }

    function testGetAgent() public {
        vm.prank(curator);
        uint256 agentId = escrow.registerAgent(1234, "ipfs://details");

        RivertingEscrow.Agent memory agent = escrow.getAgent(agentId);
        assertEq(agent.curator, curator);
        assertEq(agent.curatorRatePerSecond, 1234);
        assertEq(agent.metadataURI, "ipfs://details");
        assertTrue(agent.active);
    }

    function testSessionRate() public {
        vm.prank(curator);
        uint256 agentId = escrow.registerAgent(1_000, "ipfs://rates");

        (uint96 total, uint96 curatorRate, uint96 platformRate) = escrow.sessionRate(agentId);
        assertEq(curatorRate, 1_000);
        assertEq(platformRate, PLATFORM_FEE_RATE);
        assertEq(total, 1_000 + PLATFORM_FEE_RATE);
    }

    function testRegisterAgentEmitsEvent() public {
        vm.prank(curator);
        vm.expectEmit(true, true, false, true);
        emit AgentRegistered(0, curator, 777, "ipfs://event-only");
        escrow.registerAgent(777, "ipfs://event-only");
    }
}
