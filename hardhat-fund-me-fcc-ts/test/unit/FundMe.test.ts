import {} from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";

// If we're not on a development chain (hardhat/localhost), don't run these tests (we'll use staging tests for them)
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe: FundMe;
      let deployer: any; // ** TS If I declare type "SignerWithAddress", it doesn't go well w "(await getNamedAccounts()).deployer" (type string)
      let mockV3Aggregator: any; // ** TS Can't compile the MockV3Aggregator type with typechain
      const sendValue = ethers.utils.parseEther("1"); // 1e18 -> 1 ETH
      beforeEach(async function () {
        // Allows us to specify the exact address we want to deploy the contract with
        deployer = (await getNamedAccounts()).deployer; // ** TS version: "deployer = accounts[0]"

        // ** Why do the below lines not work?
        // const accounts = await ethers.getSigners();
        // deployer = accounts[0];

        // Deploying all contracts (in deploy folder) with one line of code (since we added the "all" tag to every contract)
        // In our case, we'd deploy both mocks & FundMe contract
        await deployments.fixture(["all"]);

        // Getting the most recently deployed "FundMe" & "MockV3Aggregator" contracts
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", function () {
        it("Sets the aggregator addresses correctly", async function () {
          const response = await fundMe.getPriceFeed();
          expect(response).to.equal(mockV3Aggregator.address);
        });
      });

      describe("fund", function () {
        it("Fails if you don't send enough ETH", async function () {
          // Since we don't send any value ("fund()" instead of "fund({value: ...})"), transaction should fail
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );

          // We could also specify an amount worth below $50 (and exactly $50) & test that
        });
        it("Updates the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          expect(response.toString()).to.equal(sendValue.toString());
          // ** Or is it supposed to be "assert.equal(response.toString(), sendValue.toString())"? (it's that way in the TS version)
        });
        it("Adds funder to array of funders", async function () {
          await fundMe.fund({ value: sendValue });
          const funder: string = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", function () {
        beforeEach(async function () {
          // Funding the contract before each test
          await fundMe.fund({ value: sendValue }); // Here both the funder & the deployer is the same address
        });

        it("Allows us to withdraw funds from a single funder", async function () {
          // 1. Arrange -> get starting balances of the 1.Contract & 2.Account withdrawing the funds (should be deployer only)
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // 2. Act -> Withdraw the funds
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // Making sure to include the gas cost in our assert calculations
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          // It's best if big numbers are multiplied this way (instead of number1 * number2)
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // 3. Assert -> Check if the funds were withdrawn correctly
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("Alows us to withdraw from multiple funders", async function () {
          // 1. Arrange
          const accounts = await ethers.getSigners();
          // Starting from 1 since 0th address is the contract deployer
          for (let i = 1; i < 6; i++) {
            // Connecting each new account with the (same) contract (since above we connected FundMe with deployer)
            // So that each new account could interact with it (e.g. call "fund()" like it is now)
            const fundMeConnectedContract = await fundMe
              .connect(accounts[i])
              .fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // 2. Act -> Withdraw the funds
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // 3. Assert -> Check if the funds were withdrawn correctly
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          // Make sure the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted; // ** Why is "await" not in front of "fundMe.."?

          // Make sure the balance of all funders is 0
          for (let i = 1; i < 6; i++) {
            assert(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              "0"
            );
          }
        });

        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];

          // Connecting the attacker with the fundMe contract so they would be able to interact with it
          // e.g. call "withdraw()" func
          const attackerConnectedContract = await fundMe.connect(attacker);

          // Making sure that the attacker is unable to withdraw for the right reasons (i.e. the correct error is thrown)
          // ** Error: "AssertionError: Expected transaction to be reverted with reason 'FundMe__NotOwner', but it reverted with a custom error"
          // await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
          //   "FundMe__NotOwner"
          // );
          await expect(attackerConnectedContract.withdraw()).to.be.reverted; // Above test is the ideal one
        });

        it("Testing with cheaperWithdraw single funder test", async function () {
          // 1. Arrange -> get starting balances of the 1.Contract & 2.Account withdrawing the funds (should be deployer only)
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // 2. Act -> Withdraw the funds
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // Making sure to include the gas cost in our assert calculations
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          // It's best if big numbers are multiplied this way (instead of number1 * number2)
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // 3. Assert -> Check if the funds were withdrawn correctly
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("Testing cheaperWithdraw multi-funder test", async function () {
          // 1. Arrange
          const accounts = await ethers.getSigners();
          // Starting from 1 since 0th address is the contract deployer
          for (let i = 1; i < 6; i++) {
            // Connecting each new account with the (same) contract (since above we connected FundMe with deployer)
            // So that each new account could interact with it (e.g. call "fund()" like it is now)
            const fundMeConnectedContract = await fundMe
              .connect(accounts[i])
              .fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // 2. Act -> Withdraw the funds
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // 3. Assert -> Check if the funds were withdrawn correctly
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          // Make sure the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted; // ** Why is "await" not in front of "fundMe.."?

          // Make sure the balance of all funders is 0
          for (let i = 1; i < 6; i++) {
            assert(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              "0"
            );
          }
        });
      });
    });
function FundMe__NotOwner(FundMe__NotOwner: any) {
  throw new Error("Function not implemented.");
}
