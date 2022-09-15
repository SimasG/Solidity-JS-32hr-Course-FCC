// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OurToken is ERC20 {
    // Specifying our new token name and symbol, as per "ERC20.sol" contract we're inheriting
    constructor(uint256 initialSupply) ERC20("OurToken", "OT") {
        // Creating the initial number of tokens (default is 0) that will be sent to the address
        // that is calling this func
        _mint(msg.sender, initialSupply);
    }
}
