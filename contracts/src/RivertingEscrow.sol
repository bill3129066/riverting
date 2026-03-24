// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RivertingEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Agent {
        address curator;
        uint96 curatorRatePerSecond;
        string metadataURI;
        bool active;
    }

    error NotAgentCurator();

    mapping(uint256 => Agent) public agents;
    uint256 public nextAgentId;
    address public platformWallet;
    uint96 public platformFeeRate;
    address public paymentToken;

    event AgentRegistered(uint256 indexed agentId, address indexed curator, uint96 curatorRate, string metadataURI);
    event AgentUpdated(uint256 indexed agentId, uint96 curatorRate, string metadataURI);
    event AgentDeactivated(uint256 indexed agentId);

    constructor(address _platformWallet, uint96 _platformFeeRate, address _paymentToken) {
        nextAgentId = 0;
        platformWallet = _platformWallet;
        platformFeeRate = _platformFeeRate;
        paymentToken = _paymentToken;
    }

    function registerAgent(uint96 curatorRatePerSecond, string calldata metadataURI) external returns (uint256 agentId) {
        agentId = nextAgentId;
        unchecked {
            nextAgentId = agentId + 1;
        }

        agents[agentId] = Agent({
            curator: msg.sender,
            curatorRatePerSecond: curatorRatePerSecond,
            metadataURI: metadataURI,
            active: true
        });

        emit AgentRegistered(agentId, msg.sender, curatorRatePerSecond, metadataURI);
        return agentId;
    }

    function updateAgent(uint256 agentId, uint96 curatorRatePerSecond, string calldata metadataURI) external {
        Agent storage agent = agents[agentId];
        if (agent.curator != msg.sender) revert NotAgentCurator();

        agent.curatorRatePerSecond = curatorRatePerSecond;
        agent.metadataURI = metadataURI;

        emit AgentUpdated(agentId, curatorRatePerSecond, metadataURI);
    }

    function deactivateAgent(uint256 agentId) external {
        Agent storage agent = agents[agentId];
        if (agent.curator != msg.sender) revert NotAgentCurator();

        agent.active = false;

        emit AgentDeactivated(agentId);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function sessionRate(uint256 agentId) external view returns (uint96 total, uint96 curator, uint96 platform) {
        curator = agents[agentId].curatorRatePerSecond;
        platform = platformFeeRate;
        total = curator + platform;
    }
}
