const { deployments, getNamedAccounts } = require("hardhat");

describe("FundMe", function () {
  let fundMe;
  beforeEach(async function () {
    const { deployer } = getNamedAccounts();
    //   deploy our fundMe contract using hardhat-deploy
    // "fixture" allows to run our entire "deploy" folder with as many tags as we want
    // e.g. we added "all" tag for both mock and actual deploy file -> that's why both will be deployed
    await deployments.fixture(["all"]);
    // fetching the most recently deployed "FundMe" contract + connecting it to deployer's address
    fundMe = await ethers.getContract("FundMe", deployer);
  });

  describe("constructor", async function () {});
});
