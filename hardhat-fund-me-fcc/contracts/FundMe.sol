// A contract that can receive ETH and withdraw it (no sending it to other though)
// 1. get funds from users
// 2. withdraw funds
// 3. set minimum funding value in USD

// **0. License Identifier
// SPDX-License-Identifier: MIT

// **1. Pragma
pragma solidity ^0.8.8;

// **2. Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// **3. Error Codes
// error FundMe__NotOwner();

// **4. Libraries

// **5. Interfaces

// **6. Contracts

// Using NatSpec  documentation convention
/** @title A contract for crowd funding
 *  @author Simas Gradeckas
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe {
    // ** 6.1 Type Declarations
    // this allows using functions in PriceConverter like methods for
    // uint256 vars (e.g. msg.value.getConversionRate)
    using PriceConverter for uint256;

    // ** 6.2 State Variables
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

    // **6.3 Events
    // **6.4 Modifiers
    // reusing code in different functions
    modifier onlyOwner() {
        require(msg.sender == i_owner, "Sender is not owner!");
        // if (msg.sender != owner revert FundMe__NotOwner())
        // specifying that we want to run the function code only after
        // checking the require condition
        _;
    }

    // **6.5 Functions
    // **6.5.1 Contructors
    // constructor gets automatically run each time a contract is deployed
    // and called?
    constructor(address priceFeedAddress) {
        // setting the owner to be the contract creator
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // **6.5.2 Receive
    receive() external payable {
        fund();
    }

    // **6.5.3 Fallback
    fallback() external payable {
        fund();
    }

    // **6.5.4 External
    // **6.5.5 Public

    /**
     *  @notice This function funds this contract
     *  @dev This implements price feeds as our library
     */
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

        // 3. Call
        // with "call", we can both value AND calldata "("")"
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed!");
    }

    // **6.5.6 Internal
    // **6.5.7 Private
    // **6.5.8 View/Pure

    // What happens if someone sends this contract ETH
    // without calling the fund func?
}
