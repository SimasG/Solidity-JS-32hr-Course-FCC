import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", function () {
      let raffle: Raffle;
      let deployer: SignerWithAddress;
      let VRFCoordinatorV2Mock: VRFCoordinatorV2Mock;
      let raffleEntranceFee: BigNumber;
      let fakePayment: BigNumber;
      let interval: number;
      let accounts: SignerWithAddress[];
      const chainId = network.config.chainId;

      beforeEach(async function () {
        // deployer = ((await getNamedAccounts()).deployer) as SignerWithAddress; // ** Doesn't work with a "SignerWithAddress" type
        accounts = await ethers.getSigners();
        deployer = accounts[0]; // Getting deployer account object

        await deployments.fixture(["all"]); // Deploying both "mocks" & "raffle"

        raffle = await ethers.getContract("Raffle", deployer);
        VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        raffleEntranceFee = await raffle.getEntranceFee();
        fakePayment = await raffle.getFakePayment();

        interval = (await raffle.getInterval()).toNumber();
      });

      describe("constructor", function () {
        // ** More tests can be done here (e.g. more vars are initialized in the constructor)
        it("Initializes the raffle correctly", async function () {
          const raffleState = await raffle.getRaffleState();

          assert.equal(raffleState.toString(), "0");
          // I guess all numbers coming from solidity will be formatted as big numbers
          assert.equal(interval.toString(), networkConfig[chainId!].interval);
        });
      });

      describe("enterRaffle", function () {
        it("Reverts when you don't pay enough", async function () {
          // Since we don't send any value ("fund()" instead of "fund({value: ...})"), transaction should fail
          // ** "AssertionError: Expected transaction to be reverted with reason 'Raffle__NotEnoughETHEntered', but it reverted with a custom error"
          await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__SendMoreToEnterRaffle");
        });

        // ** We could also add a test where we send some value, but not enough

        it("Records players when they enter", async function () {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const playerFromContract = await raffle.getPlayer(0);
          assert.equal(playerFromContract, deployer.address);
        });

        it("Emits an event on enter", async function () {
          await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
            raffle,
            "RaffleEnter"
          );
        });

        it("Doesn't allow entrance when raffle is calculating", async function () {
          // Fulfilling "checkUpkeep()" conditions
          await raffle.enterRaffle({ value: raffleEntranceFee }); // Conditions 2 & 3
          // So we're increasing time by 30 + 1 = 31 seconds? Why not just 30?
          await network.provider.send("evm_increaseTime", [interval + 1]); // Condition 1
          // Manually mining a block to allow "evm_increasetime" effects to take place
          await network.provider.send("evm_mine", []);

          // Pretending to be a Chainlink Keeper
          await raffle.performUpkeep([]); // "[]" -> empty calldata

          // ** If I await the whole "expect" I get "AssertionError: Expected transaction to be
          // ** reverted with reason 'Raffle__NotOpen', but it reverted with a custom error"
          await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
            "Raffle__NotOpen"
          );
        });
      });

      describe("checkUpkeep", function () {
        it("Returns false if people haven't sent any ETH", async function () {
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.send("evm_mine", []);

          // Simulating sending the "checkUpkeep()" transaction with "callStatic" -> accessing func's values
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded); // If "upkeepNeeded" is false (as we expected), assert will return true
        });

        it("Returns false if raffle isn't open", async function () {
          // Fulfilling all the conditions
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.send("evm_mine", []);

          // Pretending to be a Chainlink Keeper
          await raffle.performUpkeep([]);

          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);

          assert.equal(raffleState.toString() == "1", upkeepNeeded == false);
        });

        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval - 1]);
          // Same as "await network.provider.send("evm_mine", [])"
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // "0x" is same as "[]"
          assert(!upkeepNeeded);
        });

        it("returns true if enough time has passed, has players, ETH, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", () => {
        it("Can only run if checkUpkeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.send("evm_mine", []);
          const tx = await raffle.performUpkeep([]);
          // If performUpkeep is run, "tx" will be an object (truthy), else it'll be "undefined" (falsey)
          assert(tx);
        });

        it("Reverts when checkUpkeep is false", async () => {
          // ** Again, throws an AssertionError
          await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded");
        });

        it("Updates the raffle state and emits requestId", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const txResponse = await raffle.performUpkeep([]);
          const txReceipt = await txResponse.wait(1);
          const requestId = txReceipt.events![1].args!.requestId;
          const raffleState = await raffle.getRaffleState();

          // ** RequestId is 1. Is it because it's the second event emitted, hence index 1?
          assert(requestId.toNumber() > 0);
          assert(raffleState == 1);
        });
      });

      describe("fulfillRandomWords", () => {
        // Making sure someone's entered the raffle before running tests here
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [interval + 1]);
          await network.provider.send("evm_mine", []);
        });

        it("Can only be called after performUpkeep", async () => {
          // ** Why are arguments "0" & contract address? Isn't it supposed to be
          // ** "uint256, /* requestId */ uint256[] memory randomWords"?
          await expect(
            VRFCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith("nonexistent request");
          await expect(
            VRFCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
          ).to.be.revertedWith("nonexistent request");
        });

        // Basically testing the "fulfillRandomWords()" func
        it("Picks winner, resets lottery and sends money", async () => {
          const additionalEntrants = 3;
          const startingAccountIndex = 1;
          for (let i = startingAccountIndex; i < additionalEntrants + startingAccountIndex; i++) {
            // Connecting new accounts with the "raffle" contracts (like "raffle = await ethers.getContract("Raffle", deployer)")
            const accountConnectedRaffle = raffle.connect(accounts[i]);
            await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee });
          }
          const startingTimeStamp = await raffle.getlatestTimeStamp();

          // Run "performUpkeep()" (mock being Chainlink Keepers) -> that triggers "fulfillRandomWords()"
          // Run "fulfillRandomWords()" (mock being Chainlink VRF)
          // If on testnet, we'll need to wait for "fulfillRandomWords()" to be called
          await new Promise<void>(async (resolve, reject) => {
            // Subscribing once to an event calling listener when the "WinnerPicked" event occurs
            raffle.once("WinnerPicked", async () => {
              console.log("Found the event!");
              try {
                const recentWinner = await raffle.getRecentWinner();
                // console.log("recentWinner:", recentWinner);
                // console.log(accounts[0].address);
                // console.log(accounts[1].address);
                // console.log(accounts[2].address);
                // console.log(accounts[3].address);
                const raffleState = await raffle.getRaffleState();
                const endingTimeStamp = await raffle.getlatestTimeStamp();
                const numPlayers = await raffle.getNumberOfPlayers();
                const winnerEndingBalance = await accounts[1].getBalance();

                // Can also do "assert.equal(numPlayers.toString(), "0")"
                assert.equal(numPlayers.toNumber(), 0);
                assert.equal(raffleState, 0);
                assert(endingTimeStamp > startingTimeStamp);
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance
                    .add(raffleEntranceFee.mul(additionalEntrants).add(raffleEntranceFee))
                    .toString()
                );

                resolve();
              } catch (error) {
                reject(error);
              }
            });
            // Below we will fire the event ("fulfillRandomWords()"), and the listener will pick it up, and resolve
            const tx = await raffle.performUpkeep([]);
            const txReceipt = await tx.wait(1);
            // Getting starting balance of the acc that will win (it's deterministic in the mock)
            const winnerStartingBalance = await accounts[1].getBalance();
            // ** Why "events[1]"?
            await VRFCoordinatorV2Mock.fulfillRandomWords(
              txReceipt.events![1].args!.requestId,
              raffle.address // Consuming contract (or "consumer") address
            );
          });
        });
      });
    });
