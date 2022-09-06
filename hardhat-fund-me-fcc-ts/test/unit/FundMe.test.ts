import { assert, expect } from "chai";
import { deployments, ethers, getNamedAccounts } from "hardhat";

describe("FundMe", function () {
  let fundMe: any;
  let deployer: any;
  let mockV3Aggregator: any;
  const sendValue = ethers.utils.parseEther("1"); // 1e18 -> 1 ETH
  beforeEach(async function () {
    // Allows us to specify the exact account we want to deploy the contract with
    deployer = (await getNamedAccounts()).deployer; // ** TS version: "deployer = accounts[0]"

    // Deploying all contracts (in deploy folder) with one line of code (since we added the "all" tag to every contract)
    // In our case, we'd deploy both mocks & FundMe contract
    await deployments.fixture(["all"]);

    // Getting the most recently deployed "FundMe" contract
    fundMe = ethers.getContract("FundMe", deployer);

    // ** Won't work since I don't have the MockV3Aggregator implemented
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", function () {
    it("Sets the aggregator addresses correctly", async function () {
      const response = await fundMe.priceFeed();
      expect(response).to.equal(mockV3Aggregator.address);
    });
  });

  describe("fund", function () {
    it("Fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      );
      // We could also specify an amount worth below $50 (and exactly $50) & test that
    });
    it("Updates the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      // ** Isn't it supposed to be "addressToAmountFunded[deployer.address]"?
      const response = await fundMe.addressToAmountFunded(deployer); // ** Or "deployer.address"?
      expect(response.toString()).to.equal(sendValue.toString());
      // ** Or is it supposed to be "assert.equal(response.toString(), sendValue.toString())"? (it's that way in the TS version)
    });
    it("Adds funder to array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      const funder: string = await fundMe.funders(0); // ** Again, isn't it supposed to be "funders[0]"?
      assert.equal(funder, deployer);
    });
  });
});
