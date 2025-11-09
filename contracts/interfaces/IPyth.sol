// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPyth
 * @notice Interface for Pyth Network price feeds
 * @dev Pyth uses price IDs (bytes32) instead of contract addresses
 * Sepolia deployment: 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21
 */
interface IPyth {
    struct Price {
        int64 price;        // Price with expo decimal places
        uint64 conf;        // Confidence interval
        int32 expo;         // Price exponent (e.g., -8 means 8 decimals)
        uint256 publishTime; // Unix timestamp
    }

    /**
     * @notice Get price without checking if it's fresh
     * @param id Price feed ID (e.g., ETH/USD)
     * @return price Price data structure
     */
    function getPriceUnsafe(bytes32 id) external view returns (Price memory price);

    /**
     * @notice Get price and ensure it's fresh
     * @param id Price feed ID
     * @return price Price data structure
     */
    function getPrice(bytes32 id) external view returns (Price memory price);

    /**
     * @notice Get fee for updating prices
     * @param updateData Price update data from Hermes API
     * @return feeAmount Fee in wei
     */
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount);
}
