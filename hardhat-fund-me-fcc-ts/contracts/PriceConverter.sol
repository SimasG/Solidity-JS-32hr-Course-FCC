// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing an interface (& most importantly, its ABI) to interact with it
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    // Getting price of ETH in USD
    // ** Libraries only get embedded into the contract if the library functions are *internal*
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        // );
        (, int256 price, , , ) = priceFeed.latestRoundData();

        // To get the ETH price in USD, we should divide "price" by 1e8
        // (since now it is e.g. 160000000000 but should be 1,600.00000000 USD))
        // "msg.value", however should be divided by 1e18 to get the price in ETH
        // since it's currently expressed in wei (x ETH * 1e18)
        // Hence, we're multiplying "price" by 1e10 to match "msg.value" format

        // Also changing price data type from "int256" to "uint256" -> not sure why
        return uint256(price * 1e10);
    }

    // ** Libraries only get embedded into the contract if the library functions are *internal*
    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);

        // If we multiplied "ethPrice" & "ethAmount" without dividing it by 1e18,
        // we would've received 36 0's in the result.
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}
