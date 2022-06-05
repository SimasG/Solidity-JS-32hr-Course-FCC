const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

// **pulling "getNamedAccounts" and "deployments" from "hre" -> how though?
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  // are we awaiting here because we're calling a func instead of pulling methods from a func like above?
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // now we can dinamically change the ETH/USD oracle address when deploying
  // i.e. "yarn hardhat deploy --network rinkeby" or "polygon", etc.
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    // **"getting the most recent deployment" here - not sure what that means?
    // **is this the place where we are interacting with our "00-deploy-mocks" contract?
    // **OR "yarn hardhat deploy" just automatically runs through all of our scripts (numbered from
    // ** 00 to XXX) -> the most porbable scenario
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig.chainId.ethUsdPriceFeed;
  }

  // **mock
  // if the (oracle) contract doesn't exist, we deploy a minimal version (mock) for local testing

  // **deploying the contract
  // "fundMe" -> name of the contract, "{}" -> manual overrides
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    // deployer's address
    from: deployer,
    args: args,
    log: true,
  });

  // **checking if we should verify the contract (yes if we use test/mainnet, no if we use local env)
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log("------------------------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
