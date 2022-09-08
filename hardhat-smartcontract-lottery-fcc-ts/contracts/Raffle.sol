// * Things we want to do:
// * 1. Enabling user to enter the lottery (by paying some amount) -> DONE
// * 2. Pick a (verifiably) random winner -> WIP
// * 3. Winner to be selected every X minutes -> completely automated
// * We'll be relying on Chainlink a lot. Randomness (verifiable random function (VRF)), Automated Execution (Chainlink Keepers)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol"; // This contract holds "fulfillRandomWords" func
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

error Raffle__NotEnoughETHEntered();
error Raffle__TransferFailed();

// "Raffle" contract is inheriting the functionality of "VRFConsumerBaseV2" contract ()
// In JS it would be "contract Raffle extends VRFConsumerBaseV2"
contract Raffle is VRFConsumerBaseV2 {
    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players; // Making the addresses payable so we could pay the winner
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    // ** Could we decrease the var size even more (why would a constant value of 3 take 16 bits (2^16) of storage)?
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint16 private constant NUM_WORDS = 1;

    // Lottery Variables
    address private s_recentWinner;

    /* Events */
    event RaffleEnter(address indexed player);
    event ReqestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    // "vrfCoordinatorV2" is an address of the contract that will do the random verification
    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        // ** Is "vrfCoordinator" a contract or an interface? Patrick said contract
        // ** Is it "interface (VRFCoordinatorV2Interface) + contract address (vrfCoordinatorV2) = contract (i_vrfCoordinator)"?
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    // "public" so anyone can enter our raffle | "payable" so anyone could send funds to the contract
    function enterRaffle() public payable {
        // Storing only the error code instead of the error msg string -> more gas efficient
        if (msg.value < i_entranceFee) revert Raffle__NotEnoughETHEntered();
        s_players.push(payable(msg.sender)); // typecasting "msg.sender" to be a payable address

        // Emit an event when we update a dynamic array or mapping
        emit RaffleEnter(msg.sender);
    }

    // This func will be called by the Chainlink Keepers network -> aka it can automatically run without
    // us needing to interact with it
    // Transaction 1 in generating randomness (request to Chainlink)
    function requestRandomWinner() external {
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, // called "keyHash" in docs | gasLane -> gas limit/ceiling
            i_subscriptionId,
            REQUEST_CONFIRMATIONS, // # of confirmations the Chainlink node should wait before responding
            i_callbackGasLimit, // limit for how much gas to use for the callback request to your contract's "fulfillRandomWords()"
            NUM_WORDS
        );

        emit ReqestedRaffleWinner(requestId); // ** Don't really understand why we emit an event here
    }

    // Transaction 2 in generating randomness (Chainlink's response)
    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;

        // Sending winnings to winner
        // "address(this)" -> the address of this contract "Raffle"
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) revert Raffle__TransferFailed();

        emit WinnerPicked(recentWinner); // ** What's the use of this event? Couldn't we just store the winner to a winners array?
    }

    /* View, pure funcs */
    // Getter funcs (outside users can call them to access our private/internal vars)
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }
}
