// * Things we want to do:
// * 1. Enabling user to enter the lottery (by paying some amount) -> DONE
// * 2. Pick a (verifiably) random winner -> DONE
// * 3. Winner to be selected every X minutes -> completely automated
// * We'll be relying on Chainlink a lot. Randomness (verifiable random function (VRF)), Automated Execution (Chainlink Keepers)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol"; // This contract holds "fulfillRandomWords" func
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
// Ensures we implement "checkUpkeep()" & "performUpkeep()". Does it enable us running these funcs as well? I think so
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Raffle__SendMoreToEnterRaffle();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

// "Raffle" contract is inheriting the functionality of "VRFConsumerBaseV2" contract ()
// In JS it would be "contract Raffle extends VRFConsumerBaseV2"
/**@title A sample Raffle Contract
 * @author Patrick Collins
 * @notice This contract is for creating a sample raffle contract
 * @dev This implements the Chainlink VRF Version 2 & Chainlink Keepers
 */
contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type Declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    /* State Variables */
    uint256 private immutable i_entranceFee;
    uint256 private immutable i_fakePayment;

    address payable[] private s_players; // Making the addresses payable so we could pay the winner
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery Variables
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /* Events */
    event RaffleEnter(address indexed player);
    event ReqestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    /* Functions */
    // "vrfCoordinatorV2" is an address of the contract that will do the random verification
    constructor(
        address vrfCoordinatorV2, // contract address
        uint256 entranceFee,
        bytes32 gasLane, // keyHash
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval,
        uint256 fakePayment
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        // ** Is "vrfCoordinator" a contract or an interface? Patrick said contract
        // ** Is it "interface (VRFCoordinatorV2Interface) + contract address (vrfCoordinatorV2) = contract (i_vrfCoordinator)"?
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
        i_fakePayment = fakePayment;
    }

    // "public" so anyone can enter our raffle | "payable" so anyone could send funds to the contract
    function enterRaffle() public payable {
        // Storing only the error code instead of the error msg string -> more gas efficient
        if (msg.value < i_entranceFee) revert Raffle__SendMoreToEnterRaffle();

        if (s_raffleState != RaffleState.OPEN) revert Raffle__NotOpen();
        s_players.push(payable(msg.sender)); // typecasting "msg.sender" to be a payable address

        // Emit an event when we update a dynamic array or mapping
        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is the func that Chainlink Keeper nodes call to look for the "upkeepNeeded" to return
     * "true". Once it's true, "performUpkeep()" func is triggered
     * To be true, the following should be true:
     * 1. Our specified time internal should have passed
     * 2. The lottery should have at least 1 player + have some ETH
     * 3. Our subscription is funded with LINK
     * 4. The lottery should be in an "open" state
     */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval); // Condition 1
        bool hasPlayers = s_players.length > 0; // Condition 2
        bool hasBalance = address(this).balance > 0; // Codition 3
        bool isOpen = RaffleState.OPEN == s_raffleState; // Condition 4
        upkeepNeeded = (timePassed && hasPlayers && hasBalance && isOpen);
    }

    // This func will be called by the Chainlink Keepers network -> aka it can automatically run without
    // us needing to interact with it
    // Transaction 1 in generating randomness (request to Chainlink)
    // "requestRandomWinner()" -> "performUpkeep()"
    // Chainlink nodes pay gas for executing "performUpkeep()"
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep(""); // ** Why do strings (e.g. empty string) not work w calldata?
        if (!upkeepNeeded)
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );

        s_raffleState = RaffleState.CALCULATING;
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
    // Chainlink nodes pay gas for executing "fulfillRandomWords()"
    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;

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

    function getFakePayment() public view returns (uint256) {
        return i_fakePayment;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    // "getNumWords()" can be "pure" cause we don't even need to read the blockchain to access the value
    // ** Shouldn't it return a "uint32", just like in its declaration?
    function getNumWords() public pure returns (uint32) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getlatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
