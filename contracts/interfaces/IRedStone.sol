// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRedStone
 * @notice Interface for RedStone oracle price feeds (Chainlink-compatible)
 * @dev RedStone uses the Chainlink aggregator interface
 * Price feeds are deployed per asset on each network
 */
interface IRedStone {
    /**
     * @notice Get the latest price
     * @return price Latest price (int256 for compatibility with negative values)
     */
    function latestAnswer() external view returns (int256 price);

    /**
     * @notice Get the timestamp of last update
     * @return timestamp Unix timestamp of last price update
     */
    function updatedAt() external view returns (uint256 timestamp);

    /**
     * @notice Get the number of decimals
     * @return decimals Number of decimals (usually 8)
     */
    function decimals() external view returns (uint8 decimals);

    /**
     * @notice Get latest round data (Chainlink-compatible)
     * @return roundId Round ID
     * @return answer Price
     * @return startedAt Round start time
     * @return updatedAt Last update time
     * @return answeredInRound Round when answer was computed
     */
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
