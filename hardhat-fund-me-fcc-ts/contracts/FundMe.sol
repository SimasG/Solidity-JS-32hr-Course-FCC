// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.0;

// 2. Imports
import "./PriceConverter.sol";

// 3. Error Codes
// A different way to throw errors -> more gas efficient
error FundMe__NotOwner();

// 4. Libraries
// 5. Interfaces

// 6. Contracts
contract FundMe {
    // 6.1. Type Declarations
    // Using a PriceConverter library to extract the math operations from the contract
    using PriceConverter for uint256;

    // ** s_ -> storage (the variable will be stored in storage) -> gas expensive
    // ** i_ -> immutable variable (it won't be stored in storage (& just used directly in code execution)) -> gas cheap

    // 6.2. State Variables
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    // "immutable" keyword only allows to update variable once after
    // declaring them (perfect for constructors + saves gas)
    address private immutable i_owner;

    // "constant" keyword prevents variable from being updated + saves gas
    uint256 public constant MINIMUM_USD = 50 * 1e18; // Good to leave "public" to allow others to easily see the minimum USD amount
    AggregatorV3Interface private s_priceFeed; // "priceFeed" *interface*

    // 6.3. Events (none here)

    // 6.4. Modifiers
    modifier onlyOwner() {
        // 0. Ensuring only the address that deployed this contract can withdraw funds
        // Run this code first

        // Few ways to do this:
        // 1. Old school
        // require(msg.sender == i_owner, "Sender is not the owner!");

        // 2. New & more gas efficient
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        // Run the rest of the func
        _;
    }

    // 6.5. Functions
    // 6.5.1 Constructors
    constructor(address priceFeedAddress) {
        // Assigning the owner in the constructor because it only runs once the contract is deployed
        // (aka we already have access to "msg.sender" address)
        i_owner = msg.sender;

        // Making our "priceFeedAddress" dynamic (so it could be used with different addresses)
        // ** By matching ABI ("AggregatorV3Interface") with the contract address ("priceFeedAddress"),
        // ** we get access to the *interface* itself & then are able to interact with it (e.g. get price, etc.)
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // 6.5.2. Receive
    // Triggering "fund()" func if someone sends ETH to this contract
    // without the "fund()" func
    receive() external payable {
        fund();
    }

    // 6.5.3. Fallback
    fallback() external payable {
        fund();
    }

    // 6.5.4. External Funcs

    // 6.5.5. Public Funcs
    function fund() public payable {
        // "1e18" = 1 * 10^18
        // Library functions automatically use the values they're used as
        // methods for as their initial argument
        // e.g. "msg.value" is used as the first argument for "getConversionRate(uint256 ethAmount)"
        // Additional arguments should be added normally e.g. for "getConversionRate (uint256 ethAmount, uint256 smthElse)"
        // We'd use "msg.value.getConversionRate(123)", "123" being "smthElse"
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        // 1. Resetting the amounts funded by each funder to 0
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // 2. Resetting the array
        s_funders = new address[](0);

        // 3. Withdraw the funds (to the caller of this contract)

        // ** 3 ways to send funds in EVM: **
        // 1) Transfer
        // "msg.sender" -> address data type | "payable(msg.sender)" -> address payable data type
        // Funds go from msg.sender to the caller of this contract? NO
        // Funds go from "address(this)" to "msg.sender" (who, in this case,
        // I guess is the caller of this contract?) YES
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

    function cheaperWithdraw() public onlyOwner {
        // Saving your storage var ("s_funders") into a memory var ("funders"). Now when looping over,
        // we'll be reading from the memory "funders" array instead of reading from a storage array every time
        //  -> much cheaper gas-wise
        address[] memory funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;

            s_funders = new address[](0);

            // "payable(msg.sender)" & "i_owner" seems to be the same thing
            // ** When exactly do we know that the call was successful (what's the condition)?
            (bool callSuccess, ) = i_owner.call{value: address(this).balance}(
                ""
            );
            require(callSuccess, "Call failed");
        }
    }

    // 6.5.6. Internal Funcs (none here)
    // 6.5.7. Private Funcs (none here)
    // 6.5.8. View/Pure Funcs
    // ** Getters (for internal variables) -> not sure how they work
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
