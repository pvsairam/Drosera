// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Trap, EventLog, EventFilter} from "./Trap.sol";

/**
 * @title FlashLoanTrap
 * @notice Drosera Trap for detecting suspicious flash loan activity on Aave V3
 * @dev Monitors FlashLoan events from Aave V3 Pool contract for large borrows
 * 
 * IMPORTANT: Drosera traps CANNOT have constructor parameters!
 * All configuration must be hardcoded at compile time.
 * 
 * Attack Detection Strategy:
 * - 83.3% of DeFi exploits in 2024 used flash loans
 * - Euler Finance ($197M), PenPie ($27M), Platypus ($8M) all used flash loans
 * - This trap uses EVENT-BASED detection (not balance checking) to catch attacks in real-time
 */
contract FlashLoanTrap is Trap {
    
    // Ethereum Mainnet Aave V3 Pool (hardcoded)
    address public constant AAVE_V3_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    
    // Top 10 Aave V3 tokens by flash loan volume (Ethereum mainnet)
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address public constant LINK = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
    address public constant AAVE = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9;
    address public constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;
    address public constant UNI = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984;
    address public constant MKR = 0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2;
    
    // Detection thresholds - ALL set to $50M USD equivalent
    // WETH: 25,000 ETH (18 decimals) = $50M at $2,000/ETH
    uint256 public constant WETH_THRESHOLD = 25_000 * 1e18;
    
    // USDC: 50M USDC (6 decimals) = $50M
    uint256 public constant USDC_THRESHOLD = 50_000_000 * 1e6;
    
    // USDT: 50M USDT (6 decimals) = $50M
    uint256 public constant USDT_THRESHOLD = 50_000_000 * 1e6;
    
    // DAI: 50M DAI (18 decimals) = $50M
    uint256 public constant DAI_THRESHOLD = 50_000_000 * 1e18;
    
    // WBTC: 833 BTC (8 decimals) = $50M at $60,000/BTC
    uint256 public constant WBTC_THRESHOLD = 833 * 1e8;
    
    // LINK: 2M LINK (18 decimals) = $50M at $25/LINK
    uint256 public constant LINK_THRESHOLD = 2_000_000 * 1e18;
    
    // AAVE: 333,333 AAVE (18 decimals) = $50M at $150/AAVE
    uint256 public constant AAVE_THRESHOLD = 333_333 * 1e18;
    
    // CRV: 50M CRV (18 decimals) = $50M at $1/CRV
    uint256 public constant CRV_THRESHOLD = 50_000_000 * 1e18;
    
    // UNI: 5M UNI (18 decimals) = $50M at $10/UNI
    uint256 public constant UNI_THRESHOLD = 5_000_000 * 1e18;
    
    // MKR: 20,000 MKR (18 decimals) = $50M at $2,500/MKR
    uint256 public constant MKR_THRESHOLD = 20_000 * 1e18;
    
    // Aave V3 FlashLoan event signature (VERIFIED: interestRateMode is uint8 enum)
    // event FlashLoan(address indexed target, address initiator, address indexed asset,
    //                 uint256 amount, uint8 interestRateMode, uint256 premium, uint16 indexed referralCode)
    bytes32 public constant FLASH_LOAN_EVENT_HASH = keccak256("FlashLoan(address,address,address,uint256,uint8,uint256,uint16)");
    string constant FLASH_LOAN_SIGNATURE = "FlashLoan(address,address,address,uint256,uint8,uint256,uint16)";
    
    /**
     * @notice Collect is not used in event-based detection
     */
    function collect() external view override returns (bytes memory) {
        return "";
    }
    
    /**
     * @notice Check if on-chain response should be triggered
     */
    function shouldRespond(
        bytes[] calldata /* data */
    ) external pure override returns (bool, bytes memory) {
        return (false, "");
    }
    
    /**
     * @notice Check if alert should be sent by analyzing FlashLoan events
     * @param data Event logs passed by Drosera operators (encoded EventLog array)
     */
    function shouldAlert(
        bytes[] calldata data
    ) external view override returns (bool, bytes memory) {
        if (data.length == 0) {
            return (false, "");
        }
        
        // Process each event log
        for (uint256 i = 0; i < data.length; i++) {
            EventLog memory log = abi.decode(data[i], (EventLog));
            
            // Verify event is from Aave V3 Pool
            if (log.emitter != AAVE_V3_POOL) {
                continue;
            }
            
            // Verify we have the correct number of topics (4 total: signature + 3 indexed params)
            if (log.topics.length < 4) {
                continue;
            }
            
            // Verify event signature matches FlashLoan event
            if (log.topics[0] != FLASH_LOAN_EVENT_HASH) {
                continue;
            }
            
            // Decode FlashLoan event
            // Topics: [0] = event signature hash, [1] = target (indexed), [2] = asset (indexed), [3] = referralCode (indexed)
            // Data: initiator (address), amount (uint256), interestRateMode (uint8), premium (uint256)
            
            address asset = address(uint160(uint256(log.topics[2])));
            
            // Decode amount from event data
            (, uint256 amount, , ) = abi.decode(
                log.data,
                (address, uint256, uint8, uint256)
            );
            
            // Check if flash loan amount exceeds threshold for this asset
            if (asset == WETH && amount > WETH_THRESHOLD) {
                return (true, abi.encode("Suspicious WETH flash loan detected", amount, asset));
            }
            
            if (asset == USDC && amount > USDC_THRESHOLD) {
                return (true, abi.encode("Suspicious USDC flash loan detected", amount, asset));
            }
            
            if (asset == USDT && amount > USDT_THRESHOLD) {
                return (true, abi.encode("Suspicious USDT flash loan detected", amount, asset));
            }
            
            if (asset == DAI && amount > DAI_THRESHOLD) {
                return (true, abi.encode("Suspicious DAI flash loan detected", amount, asset));
            }
            
            if (asset == WBTC && amount > WBTC_THRESHOLD) {
                return (true, abi.encode("Suspicious WBTC flash loan detected", amount, asset));
            }
            
            if (asset == LINK && amount > LINK_THRESHOLD) {
                return (true, abi.encode("Suspicious LINK flash loan detected", amount, asset));
            }
            
            if (asset == AAVE && amount > AAVE_THRESHOLD) {
                return (true, abi.encode("Suspicious AAVE flash loan detected", amount, asset));
            }
            
            if (asset == CRV && amount > CRV_THRESHOLD) {
                return (true, abi.encode("Suspicious CRV flash loan detected", amount, asset));
            }
            
            if (asset == UNI && amount > UNI_THRESHOLD) {
                return (true, abi.encode("Suspicious UNI flash loan detected", amount, asset));
            }
            
            if (asset == MKR && amount > MKR_THRESHOLD) {
                return (true, abi.encode("Suspicious MKR flash loan detected", amount, asset));
            }
        }
        
        return (false, "");
    }
    
    /**
     * @notice Subscribe to FlashLoan events from Aave V3 Pool
     */
    function eventLogFilters() public pure override returns (EventFilter[] memory) {
        EventFilter[] memory filters = new EventFilter[](1);
        
        filters[0] = EventFilter({
            contractAddress: AAVE_V3_POOL,
            signature: FLASH_LOAN_SIGNATURE
        });
        
        return filters;
    }
}
