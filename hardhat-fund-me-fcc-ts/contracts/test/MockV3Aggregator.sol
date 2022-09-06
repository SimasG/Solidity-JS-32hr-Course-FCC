// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
// pragma solidity <=0.6.5;

// Creating our own fake price feed contract for local testing
import "@chainlink/contracts/src/v0.6/tests/MockV3Aggregator.sol"; // Very sensitive with sol compiler versions, weird
