// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./PriceConverter.sol";

// A different way to throw errors -> more gas efficient
error NotOwner();

// SIT DOWN WITH A PIECE OF PAPER TO NAIL THE 18 DECIMAL MATH HERE
contract FundMe {
    // Using a PriceConverter library to extract the math operations from the contract
    using PriceConverter for uint256;

    // "constant" keyword prevents variable from being updated + saves gas
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    // "immutable" keyword only allows to update variable once after
    // declaring them (perfect for constructors + saves gas)
    address public immutable i_owner;

    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        // Assigning the owner in the constructor because it only runs once the contract is deployed
        // (aka we already have access to "msg.sender" address)
        i_owner = msg.sender;

        // Making our "priceFeedAddress" dynamic (so it could be used with different addresses)
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        // "1e18" = 1 * 10^18
        // Library functions automatically use the values they're used as
        // methods for as their initial argument
        // e.g. "msg.value" is used as the first argument for "getConversion(uint256 ethAmount)"
        // Additional arguments should be added normally e.g. for "getConversion (uint256 ethAmount, uint256 smthElse)"
        // We'd use "msg.value.getConversion(123)", "123" being "smthElse"
        require(
            msg.value.getConversion(priceFeed) >= MINIMUM_USD,
            "Not enough eth sent!"
        );
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        // 1. Resetting the amounts funded by each funder to 0
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        // 2. Resetting the array
        funders = new address[](0);

        // 3. Withdraw the funds (to the caller of this contract)

        // ** 3 ways to send funds in EVM: **
        // 1) Transfer
        // "msg.sender" -> address data type | "payable(msg.sender)" -> address payable data type
        // Funds go from msg.sender to the caller of this contract? NO
        // Funds go from "address(this)" to "msg.sender" (who, in this case,
        // I guess is the caller of this contract?)
        // payable(msg.sender).transfer(address(this).balance);

        // 2) Send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        // 3) Call - *currently the recommended way to send & receive funds*
        // leaving "call()" blank since we don't want to call this func on any other contract
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    modifier onlyOwner() {
        // 0. Ensuring only the address that deployed this contract can withdraw funds
        // Run this code first

        // Few ways to do this:
        // 1. Old school
        // require(msg.sender == i_owner, "Sender is not the owner!");

        // 2. New & more gas efficient
        if (msg.sender != i_owner) {
            revert NotOwner();
        }

        // Run the rest of the func
        _;
    }

    // Triggering "fund()" func if someone sends ETH to this contract
    // without the "fund()" func
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
