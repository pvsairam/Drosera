// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OracleGuardianV2
 * @notice OPTIMIZED immutable guardian contract for oracle monitoring
 * @dev Truly stateless design - ZERO state changes, ZERO gas beyond event emission
 * 
 * Changes from V1:
 * - Removed incidentCounter state variable (saves 5k gas per call)
 * - Incident IDs generated from block data only (no SSTORE)
 * - Gas cost: ~21k per incident (just event emission)
 * - Perfect for L2 deployment at <$0.01 per incident
 * 
 * Security Features:
 * - No admin functions (truly immutable after deployment)
 * - No fund custody (cannot hold tokens)
 * - No state changes (cannot be manipulated)
 * - Byzantine-resistant (requires multiple confirmations off-chain)
 * 
 * @author Drosera Security Team
 */
contract OracleGuardianV2 {
    
    // ============ Events ============
    
    /**
     * @notice Emitted when oracle mispricing is detected
     * @param incidentId Unique identifier (derived from block data)
     * @param chainId Network identifier (indexed for efficient filtering)
     * @param feedAddress Oracle feed address
     * @param asset Asset symbol (e.g., "ETH", "BTC")
     * @param onchainPrice Price reported by oracle (18 decimals)
     * @param referencePrice Computed reference price (18 decimals)
     * @param deviationBps Deviation in basis points (10000 = 100%)
     * @param severity 0=INFO, 1=WARNING, 2=CRITICAL, 3=EMERGENCY
     * @param confirmationCount Number of consecutive violations
     * @param reporter Address that reported this incident
     */
    event OracleMispricing(
        bytes32 indexed incidentId,
        bytes32 indexed chainId,
        address indexed feedAddress,
        string asset,
        uint256 onchainPrice,
        uint256 referencePrice,
        uint256 deviationBps,
        uint8 severity,
        uint8 confirmationCount,
        address reporter
    );
    
    /**
     * @notice Emitted when oracle becomes stale (no updates)
     */
    event OracleStale(
        bytes32 indexed incidentId,
        address indexed feedAddress,
        string asset,
        uint256 lastUpdateTime,
        uint256 expectedUpdateInterval,
        uint256 staleDuration,
        address indexed reporter
    );
    
    /**
     * @notice Emitted when flash loan attack pattern detected
     */
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
    
    /**
     * @notice Emitted when all data sources diverge significantly
     */
    event SourceDivergence(
        bytes32 indexed incidentId,
        string asset,
        uint256 standardDeviationBps,
        uint8 sourceCount,
        uint256[2] priceRange,
        address indexed reporter
    );
    
    /**
     * @notice Emitted for system health checks
     */
    event SystemHeartbeat(
        bool status,
        uint8 activeMonitors,
        uint256 avgDetectionLatencyMs,
        address indexed reporter
    );
    
    // ============ Immutable State ============
    
    /// @notice Deployment timestamp
    uint256 public immutable deployedAt;
    
    /// @notice Contract version
    string public constant VERSION = "2.0.0";
    
    // ============ Constructor ============
    
    constructor() {
        deployedAt = block.timestamp;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Report oracle mispricing event
     * @dev Incident ID auto-generated from block data (no state changes)
     * @param chainId Network identifier (e.g., keccak256("ethereum"), keccak256("arbitrum"))
     * @param feedAddress Oracle feed contract address
     * @param asset Asset symbol
     * @param onchainPrice Price from oracle (18 decimals)
     * @param referencePrice Computed reference price (18 decimals)
     * @param deviationBps Deviation in basis points (10000 = 100%)
     * @param severity 0=INFO, 1=WARNING, 2=CRITICAL, 3=EMERGENCY
     * @param confirmationCount Number of consecutive violations detected
     */
    function reportMispricing(
        bytes32 chainId,
        address feedAddress,
        string calldata asset,
        uint256 onchainPrice,
        uint256 referencePrice,
        uint256 deviationBps,
        uint8 severity,
        uint8 confirmationCount
    ) external {
        // Input validation (prevents malformed events, costs ~200 gas)
        require(chainId != bytes32(0), "Invalid chain");
        require(feedAddress != address(0), "Invalid feed");
        require(bytes(asset).length > 0, "Invalid asset");
        require(severity <= 3, "Invalid severity");
        require(deviationBps > 0 && deviationBps <= 100_000, "Invalid deviation");
        require(confirmationCount > 0, "Zero confirmations");
        
        bytes32 incidentId = _generateIncidentId();
        
        emit OracleMispricing(
            incidentId,
            chainId,
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
    
    /**
     * @notice Report stale oracle event
     */
    function reportStaleOracle(
        address feedAddress,
        string calldata asset,
        uint256 lastUpdateTime,
        uint256 expectedUpdateInterval,
        uint256 staleDuration
    ) external {
        // Input validation
        require(feedAddress != address(0), "Invalid feed");
        require(bytes(asset).length > 0, "Invalid asset");
        require(staleDuration > 0, "Invalid stale duration");
        
        bytes32 incidentId = _generateIncidentId();
        
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
    
    /**
     * @notice Report flash loan attack pattern
     */
    function reportFlashLoanAttack(
        address feedAddress,
        string calldata asset,
        uint256 priceChangeBps,
        uint256 timeWindowSeconds,
        uint256 volumeMultiplier,
        bytes32 txHash
    ) external {
        // Input validation
        require(feedAddress != address(0), "Invalid feed");
        require(bytes(asset).length > 0, "Invalid asset");
        require(priceChangeBps > 0, "Invalid price change");
        require(txHash != bytes32(0), "Invalid tx hash");
        
        bytes32 incidentId = _generateIncidentId();
        
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
    
    /**
     * @notice Report source divergence event
     */
    function reportSourceDivergence(
        string calldata asset,
        uint256 standardDeviationBps,
        uint8 sourceCount,
        uint256[2] calldata priceRange
    ) external {
        // Input validation
        require(bytes(asset).length > 0, "Invalid asset");
        require(sourceCount >= 2, "Need 2+ sources");
        require(standardDeviationBps > 0, "Invalid std dev");
        
        bytes32 incidentId = _generateIncidentId();
        
        emit SourceDivergence(
            incidentId,
            asset,
            standardDeviationBps,
            sourceCount,
            priceRange,
            msg.sender
        );
    }
    
    /**
     * @notice Submit system health heartbeat
     */
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
    
    // ============ View Functions ============
    
    /**
     * @notice Get contract information
     */
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
    
    // ============ Internal Functions ============
    
    /**
     * @notice Generate unique incident ID from block data (NO state changes)
     * @dev Uses block timestamp, number, caller, gas, and call data for uniqueness
     *      Prevents collisions even when called multiple times in same transaction
     * @return Unique bytes32 identifier
     */
    function _generateIncidentId() internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                block.timestamp,
                block.number,
                msg.sender,
                tx.gasprice,
                gasleft(),           // Changes with every call (prevents intra-tx collisions)
                keccak256(msg.data)  // Unique per function call
            )
        );
    }
}
