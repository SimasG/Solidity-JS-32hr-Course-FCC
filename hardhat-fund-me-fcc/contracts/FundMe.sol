// A contract that can receive ETH and withdraw it (no sending it to other though)
// 1. get funds from users
// 2. withdraw funds
// 3. set minimum funding value in USD

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "./PriceConverter.sol";

contract FundMe {
    // this allows using functions in PriceConverter like methods for
    // uint256 vars (e.g. msg.value.getConversionRate)
    using PriceConverter for uint256;

    // post on github discussions why do we need to multiply it by 1e18
    // "constant" prevents the var from being changed -> costs less gas
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    // keeping track of all funders by making an array of their addresses
    // strictly addresses since that is the data type we specified
    address[] public funders;

    // connecting address with the amount funded so we could track
    // which address sent how much
    mapping(address => uint256) public addressToAmountFunded;

    // "immutable" makes the var read-only (like "constant")
    // but assignable in the constructor -> costs less gass
    address public immutable i_owner;

    AggregatorV3Interface public priceFeed;

    // constructor gets automatically run each time a contract is deployed
    // and called?
    constructor(address priceFeedAddress) {
        // setting the owner to be the contract creator
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // "payable" implies that value will be sent in this function
    function fund() public payable {
        // "msg.value" is a number of wei sent in the transaction
        // here in "getConversionRate" we're not passing an argument even though
        // we've specified a parameter in the original func
        // that is because anything that "getConversionRate" is being used as a
        // method on is considered the first argument of the function
        require(
            msg.value.getConversionRate(priceFeed) > MINIMUM_USD,
            "Didn't send enough!"
        );
        addressToAmountFunded[msg.sender] = msg.value;
        // "msg.sender" is a globally available variable for sender's wallet address
        funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        // resetting the amount sent by each funder
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        // resetting the funders array by creating a new array with 0 items
        funders = new address[](0);

        // actually withdrawing the funds. there are 3 methds:
        // // 1. Transfer
        // // changing the data type from address to payable address
        // // we can only make transactions with payable address data types
        // payable(msg.sender).transfer(address(this).balance);

        // // 2. Send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // // we have to add the "require" because "send" doesn't throw errors if
        // // unsuccessful. instead if returns a boolean
        // // if sendSuccess = false, throw error "Send failed!";
        // require(sendSuccess, "Send failed!");

        // 3. Call
        // with "call", we can both value AND calldata "("")"
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed!");
    }

    // reusing code in different functions
    modifier onlyOwner() {
        require(msg.sender == i_owner, "Sender is not owner!");
        // specifying that we want to run the function code only after
        // checking the require condition
        _;
    }

    // What happens if someone sends this contract ETH
    // without calling the fund func?

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
