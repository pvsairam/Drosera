// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Trap, EventLog, EventFilter} from "./Trap.sol";
import {IPyth} from "./interfaces/IPyth.sol";
import {IRedStone} from "./interfaces/IRedStone.sol";

/**
 * @title OraclePriceTrap
 * @notice Drosera Trap for monitoring oracle price feeds across multiple sources
 * @dev Detects price manipulation, staleness, flash loan attacks, and source divergence
 * 
 * Ethereum Mainnet Deployment:
 * - Pyth Oracle: 0xff1a0f4744e8582DF1aE09D5611b887B6a12925C
 * - Chainlink ETH/USD: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
 * - ETH/USD Price Feed ID: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
 */
contract OraclePriceTrap is Trap {
    
    // Ethereum Mainnet Oracle Addresses (hardcoded - no constructor allowed by Drosera)
    address public constant PYTH_CONTRACT = 0xff1a0f4744e8582DF1aE09D5611b887B6a12925C;
    address public constant CHAINLINK_ETH_USD = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    
    uint256 public constant DEVIATION_THRESHOLD = 1500; // 15% in basis points
    uint256 public constant STALENESS_THRESHOLD = 3600; // 1 hour in seconds
    
    /**
     * @notice Collect oracle price data from blockchain
     * @dev Called by Drosera operators every block (off-chain)
     */
    function collect() external view override returns (bytes memory) {
        // Fetch Pyth price
        IPyth.Price memory pythData = IPyth(PYTH_CONTRACT).getPriceUnsafe(ETH_USD_PRICE_ID);
        
        // Fetch Chainlink price using latestRoundData()
        (
            ,
            int256 chainlinkAnswer,
            ,
            uint256 chainlinkTimestamp,
            
        ) = IRedStone(CHAINLINK_ETH_USD).latestRoundData();
        
        // Validate prices are positive (prevent overflow)
        require(pythData.price > 0, "Pyth: Invalid negative price");
        require(chainlinkAnswer > 0, "Chainlink: Invalid negative price");
        
        // Get decimals from oracle contracts
        uint8 chainlinkDecimals = IRedStone(CHAINLINK_ETH_USD).decimals();
        
        // Convert Pyth expo to decimals (expo is negative, e.g., -8 for 8 decimals)
        uint8 pythDecimals = uint8(uint32(-pythData.expo));
        
        PriceData memory data = PriceData({
            pythPrice: uint256(uint64(pythData.price)),
            pythTimestamp: pythData.publishTime,
            pythDecimals: pythDecimals,
            chainlinkPrice: uint256(chainlinkAnswer),
            chainlinkTimestamp: chainlinkTimestamp,
            chainlinkDecimals: chainlinkDecimals,
            blockTime: block.timestamp
        });
        
        return abi.encode(data);
    }
    
    /**
     * @notice Check if on-chain response should be triggered
     * @dev We don't trigger on-chain actions (save gas, operators handle alerts)
     */
    function shouldRespond(
        bytes[] calldata /* data */
    ) external pure override returns (bool, bytes memory) {
        return (false, "");
    }
    
    /**
     * @notice Check if alert should be sent (main detection logic)
     * @dev Uses blockTime from collected data (pure function, no state access)
     */
    function shouldAlert(
        bytes[] calldata data
    ) external pure override returns (bool, bytes memory) {
        if (data.length == 0) {
            return (false, "");
        }
        
        PriceData memory latest = abi.decode(data[0], (PriceData));
        
        // FIX #4: Check for zero prices first (prevent division by zero)
        if (latest.pythPrice == 0) {
            return (true, abi.encode("Pyth oracle returned zero price"));
        }
        
        if (latest.chainlinkPrice == 0) {
            return (true, abi.encode("Chainlink oracle returned zero price"));
        }
        
        // FIX #2: Use latest.blockTime instead of block.timestamp (data already has it)
        // Check for stale Pyth oracle
        if (latest.blockTime - latest.pythTimestamp > STALENESS_THRESHOLD) {
            return (true, abi.encode("Pyth oracle is stale"));
        }
        
        // Check for stale Chainlink oracle
        if (latest.blockTime - latest.chainlinkTimestamp > STALENESS_THRESHOLD) {
            return (true, abi.encode("Chainlink oracle is stale"));
        }
        
        // FIX #3: Normalize prices to same decimal scale (18 decimals)
        uint256 pythNormalized = _normalizePrice(latest.pythPrice, latest.pythDecimals);
        uint256 redstoneNormalized = _normalizePrice(latest.chainlinkPrice, latest.chainlinkDecimals);
        
        // Calculate divergence with normalized prices
        uint256 diff = pythNormalized > redstoneNormalized 
            ? pythNormalized - redstoneNormalized
            : redstoneNormalized - pythNormalized;
        
        uint256 avgPrice = (pythNormalized + redstoneNormalized) / 2;
        
        // Safety check (should never happen after zero checks above)
        if (avgPrice == 0) {
            return (true, abi.encode("Average price is zero"));
        }
        
        uint256 deviationBps = (diff * 10000) / avgPrice;
        
        if (deviationBps > DEVIATION_THRESHOLD) {
            return (true, abi.encode("Oracle price divergence detected", deviationBps));
        }
        
        return (false, "");
    }
    
    /**
     * @notice Normalize price to 18 decimals
     * @dev FIX #3: Ensures Pyth (18 decimals) and RedStone (8 decimals) are comparable
     */
    function _normalizePrice(uint256 price, uint8 decimals) internal pure returns (uint256) {
        if (decimals < 18) {
            return price * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            return price / (10 ** (decimals - 18));
        }
        return price;
    }
    
    /**
     * @notice Event log filters (not used for this trap)
     */
    function eventLogFilters() public pure override returns (EventFilter[] memory) {
        EventFilter[] memory filters = new EventFilter[](0);
        return filters;
    }
}

/**
 * @notice Structure to hold collected price data
 */
struct PriceData {
    uint256 pythPrice;          // Pyth price (raw, with pythDecimals)
    uint256 pythTimestamp;      // Pyth last update time
    uint8 pythDecimals;         // Pyth decimals (from expo field)
    uint256 chainlinkPrice;     // Chainlink price (raw, with chainlinkDecimals)
    uint256 chainlinkTimestamp; // Chainlink last update time
    uint8 chainlinkDecimals;    // Chainlink decimals
    uint256 blockTime;          // Block timestamp when collected
}
