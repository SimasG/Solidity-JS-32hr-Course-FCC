import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { Raffle } from "../../typechain-types";

/* Things required to test this on a testnet: */
// 1. subscriptionId for Chainlink VRF -> DONE
// 2. Deploying our contract using subscriptionId -> DONE
// 3. Register the contract with Chainlink VRF & its subscriptionId (adding deployed contract address as a Chainlink VRF consumer) -> DONE
// 4. Register the contract with Chainlink Keepers -> DONE
// 5. Run staging tests

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Staging Tests", function () {
      let raffle: Raffle;
      let deployer: SignerWithAddress;
      let raffleEntranceFee: BigNumber;
      let accounts: SignerWithAddress[];

      beforeEach(async function () {
        accounts = await ethers.getSigners();
        deployer = accounts[0]; // Getting deployer account object

        raffle = await ethers.getContract("Raffle", deployer);
        raffleEntranceFee = await raffle.getEntranceFee();
      });

      describe("fulfillRandomWords", () => {
        it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
          // Enter the raffle
          console.log("Setting up test...");
          const startingTimeStamp = await raffle.getlatestTimeStamp();

          console.log("Setting up listener...");
          await new Promise<void>(async (resolve, reject) => {
            // 1. Set up listener before we enter the raffle in case the blockchain moves really fast
            raffle.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!");
              try {
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerEndingBalance = await deployer.getBalance();
                const endingTimeStamp = await raffle.getlatestTimeStamp();

                // Checking if our parameters have been reset after picking the winner
                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner, deployer.address);
                assert.equal(raffleState, 0);
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance.add(raffleEntranceFee).toString()
                );
                assert(endingTimeStamp > startingTimeStamp);

                resolve();
              } catch (error) {
                console.log(error);
                reject(error);
              }
            });

            // 2. Entering raffle
            console.log("Entering raffle...");
            const tx = await raffle.enterRaffle({ value: raffleEntranceFee });
            await tx.wait(1);

            console.log("Ok, time to wait...");

            const winnerStartingBalance = await deployer.getBalance();

            // This code won't complete until the event listener has fired & the promise has either been resolved or rejected
          });
        });
      });
    });
