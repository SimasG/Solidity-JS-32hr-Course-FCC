// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// importing code from github (as a NPM package at chainlink/contracts)
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// Libraries are similar to contracts, but you can’t declare any state
// variable (i.e. spend gas) and you can’t send ether.
library PriceConverter {
    // getting ETH price in USD -> interacting with outside data -> oracles
    // Rinkeby testnet
    // ETH/USD address: 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
    // ABI: AggregatorV3Interface
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // type: AggregatorV3Interface, var name: priceFeed
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        // );
        // "latestRoundData" returns 5 outputs but we only want 1
        // that's why we put commas for outputs we don't need
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // it returns price with 8 decimals (e.g. 2,000.00000000)
        // that's why we have to add 10 decimals to have 18 total (convention)
        // converting price from int256 to uint256 type
        return uint256(price * 1e10); // 10**10
    }

    // converting specified # of ETH to USD
    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // getting the eth price in usd
        uint256 ethPrice = getPrice(priceFeed);

        // ethPrice -> 18 decimals, ethAmount -> 18 decimals
        // that's why we have to divide by 18 decimals
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;

        // still 18 decimals left. why can't we just divide by 1e36 up there?
        return ethAmountInUsd;
    }
}
