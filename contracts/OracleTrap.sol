// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Oracle monitoring trap for Drosera
// Logs oracle incidents without storing state to keep gas costs down
contract OracleTrap {
    
    // Track when this was deployed
    uint256 public immutable deployedAt;
    
    // Simple version string
    string public constant VERSION = "1.0.0";
    
    // When an oracle price looks wrong
    event OracleMispricing(
        bytes32 indexed incidentId,
        string chain,
        address indexed feedAddress,
        string asset,
        uint256 onchainPrice,
        uint256 referencePrice,
        uint256 deviationBps,
        uint8 severity,
        uint8 confirmationCount,
        address indexed reporter
    );
    
    // When an oracle stops updating
    event OracleStale(
        bytes32 indexed incidentId,
        address indexed feedAddress,
        string asset,
        uint256 lastUpdateTime,
        uint256 expectedUpdateInterval,
        uint256 staleDuration,
        address indexed reporter
    );
    
    // When we detect a flash loan attack
    event FlashLoanAttackDetected(
        bytes32 indexed incidentId,
        address indexed feedAddress,
        string asset,
        uint256 priceChangeBps,
        uint256 timeWindowSeconds,
        uint256 volumeMultiplier,
        bytes32 txHash,
        address indexed reporter
    );
    
    // When oracle sources disagree too much
    event SourceDivergence(
        bytes32 indexed incidentId,
        string asset,
        uint256 standardDeviationBps,
        uint8 sourceCount,
        uint256[2] priceRange,
        address indexed reporter
    );
    
    // Heartbeat to show the system is alive
    event SystemHeartbeat(
        bool status,
        uint8 activeMonitors,
        uint256 avgDetectionLatencyMs,
        address indexed reporter
    );
    
    constructor() {
        deployedAt = block.timestamp;
    }
    
    // Report a price that's off from what it should be
    function reportMispricing(
        string calldata chain,
        address feedAddress,
        string calldata asset,
        uint256 onchainPrice,
        uint256 referencePrice,
        uint256 deviationBps,
        uint8 severity,
        uint8 confirmationCount
    ) external {
        // Make a unique ID based on the current block
        bytes32 incidentId = keccak256(
            abi.encodePacked(
                block.timestamp,
                block.number,
                msg.sender,
                tx.gasprice
            )
        );
        
        emit OracleMispricing(
            incidentId,
            chain,
            feedAddress,
            asset,
            onchainPrice,
            referencePrice,
            deviationBps,
            severity,
            confirmationCount,
            msg.sender
        );
    }
    
    // Report an oracle that hasn't updated in too long
    function reportStaleOracle(
        address feedAddress,
        string calldata asset,
        uint256 lastUpdateTime,
        uint256 expectedUpdateInterval,
        uint256 staleDuration
    ) external {
        bytes32 incidentId = keccak256(
            abi.encodePacked(
                block.timestamp,
                block.number,
                msg.sender,
                tx.gasprice
            )
        );
        
        emit OracleStale(
            incidentId,
            feedAddress,
            asset,
            lastUpdateTime,
            expectedUpdateInterval,
            staleDuration,
            msg.sender
        );
    }
    
    // Report a suspected flash loan attack
    function reportFlashLoanAttack(
        address feedAddress,
        string calldata asset,
        uint256 priceChangeBps,
        uint256 timeWindowSeconds,
        uint256 volumeMultiplier,
        bytes32 txHash
    ) external {
        bytes32 incidentId = keccak256(
            abi.encodePacked(
                block.timestamp,
                block.number,
                msg.sender,
                tx.gasprice
            )
        );
        
        emit FlashLoanAttackDetected(
            incidentId,
            feedAddress,
            asset,
            priceChangeBps,
            timeWindowSeconds,
            volumeMultiplier,
            txHash,
            msg.sender
        );
    }
    
    // Report when data sources don't agree
    function reportSourceDivergence(
        string calldata asset,
        uint256 standardDeviationBps,
        uint8 sourceCount,
        uint256[2] calldata priceRange
    ) external {
        bytes32 incidentId = keccak256(
            abi.encodePacked(
                block.timestamp,
                block.number,
                msg.sender,
                tx.gasprice
            )
        );
        
        emit SourceDivergence(
            incidentId,
            asset,
            standardDeviationBps,
            sourceCount,
            priceRange,
            msg.sender
        );
    }
    
    // Send a heartbeat to prove the system is working
    function submitHeartbeat(
        bool status,
        uint8 activeMonitors,
        uint256 avgLatencyMs
    ) external {
        emit SystemHeartbeat(
            status,
            activeMonitors,
            avgLatencyMs,
            msg.sender
        );
    }
    
    // Get some basic info about this contract
    function getInfo() 
        external 
        view 
        returns (
            string memory version,
            uint256 deployed
        ) 
    {
        return (VERSION, deployedAt);
    }
}
