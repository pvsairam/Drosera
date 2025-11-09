// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IAaveV3Pool
 * @notice Interface for Aave V3 Pool contract on Ethereum mainnet
 * @dev Used to fetch reserve data and flash loan information
 */
interface IAaveV3Pool {
    
    /**
     * @notice Reserve data structure
     */
    struct ReserveData {
        uint256 configuration;
        uint128 liquidityIndex;
        uint128 currentLiquidityRate;
        uint128 variableBorrowIndex;
        uint128 currentVariableBorrowRate;
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        uint16 id;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint128 accruedToTreasury;
        uint128 unbacked;
        uint128 isolationModeTotalDebt;
    }
    
    /**
     * @notice Get reserve data for a specific asset
     * @param asset The address of the underlying asset
     * @return Reserve data including debt tokens and interest rates
     */
    function getReserveData(address asset) external view returns (ReserveData memory);
    
    /**
     * @notice Get normalized total debt for a reserve
     * @param asset The address of the underlying asset
     * @return Total variable debt + stable debt
     */
    function getReserveNormalizedVariableDebt(address asset) external view returns (uint256);
}

/**
 * @title IVariableDebtToken
 * @notice Interface for Aave V3 Variable Debt Token
 */
interface IVariableDebtToken {
    /**
     * @notice Get total supply of debt tokens
     * @return Total debt in the reserve
     */
    function totalSupply() external view returns (uint256);
    
    /**
     * @notice Get the scaled total supply of debt tokens
     * @return Scaled total supply
     */
    function scaledTotalSupply() external view returns (uint256);
}
