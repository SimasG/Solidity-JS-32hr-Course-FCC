// creating our own contract as a mock
const { network } = require("hardhat");
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (developmentChains.includes(network.name)) {
    log("Local network detected. Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      //   taking in the arguments from the constructor in MockV3Aggregator.sol
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("Mocks deployed!");
    log("-----------------------------------------------------------");
  }
};

// allows us to choose which contracts to deploy
module.exports.tags = ["all", "mocks"];
